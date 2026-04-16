// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title MetaStake — veMETA governance staking
/// @notice Lock native META to receive non-transferable veMETA voting power.
///         veMETA decays linearly toward zero as the lock approaches expiry.
/// @dev    Follows the Curve veCRV model (simplified). Unlock times are rounded
///         down to whole weeks for cleaner epoch alignment in Phase 2.
contract MetaStake is ReentrancyGuard {
    // ── Immutables ───────────────────────────────────────────────────────
    uint256 public immutable MAX_LOCK;

    // ── Constants ────────────────────────────────────────────────────────
    uint256 public constant MIN_LOCK = 1 weeks;
    uint256 public constant WEEK = 1 weeks;

    // ── Storage ──────────────────────────────────────────────────────────
    struct Lock {
        uint256 amount;
        uint256 unlockTime;
    }

    mapping(address => Lock) public locks;
    uint256 public totalLocked;

    // Staker enumeration (for totalSupply iteration)
    address[] private _stakers;
    mapping(address => uint256) private _stakerIdx; // 1-indexed; 0 = absent

    // ── Events ───────────────────────────────────────────────────────────
    event Locked(address indexed user, uint256 amount, uint256 unlockTime);
    event AmountIncreased(address indexed user, uint256 addedAmount, uint256 newTotal);
    event LockExtended(address indexed user, uint256 newUnlockTime);
    event Withdrawn(address indexed user, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────────
    error ZeroAmount();
    error LockTooShort();
    error LockTooLong();
    error LockExists();
    error NoLock();
    error LockExpired();
    error LockNotExpired();
    error UnlockTimeTooEarly();
    error TransferFailed();

    // ── Constructor ──────────────────────────────────────────────────────
    /// @param maxLock_ Maximum lock duration in seconds (e.g. 365 days)
    constructor(uint256 maxLock_) {
        MAX_LOCK = maxLock_;
    }

    // ── Write ────────────────────────────────────────────────────────────

    /// @notice Create a new lock by sending native META.
    /// @param duration Lock duration in seconds (MIN_LOCK ≤ duration ≤ MAX_LOCK).
    function createLock(uint256 duration) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        if (duration < MIN_LOCK) revert LockTooShort();
        if (duration > MAX_LOCK) revert LockTooLong();
        if (locks[msg.sender].amount != 0) revert LockExists();

        uint256 unlockTime = _roundToWeek(block.timestamp + duration);

        locks[msg.sender] = Lock({amount: msg.value, unlockTime: unlockTime});
        totalLocked += msg.value;
        _addStaker(msg.sender);

        emit Locked(msg.sender, msg.value, unlockTime);
    }

    /// @notice Add more META to an existing (non-expired) lock.
    function increaseAmount() external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        Lock storage lock = locks[msg.sender];
        if (lock.amount == 0) revert NoLock();
        if (block.timestamp >= lock.unlockTime) revert LockExpired();

        lock.amount += msg.value;
        totalLocked += msg.value;

        emit AmountIncreased(msg.sender, msg.value, lock.amount);
    }

    /// @notice Extend lock to a new unlock time (must be strictly later than current).
    /// @param newUnlockTime Desired unlock timestamp (will be rounded down to week).
    function extendLock(uint256 newUnlockTime) external {
        Lock storage lock = locks[msg.sender];
        if (lock.amount == 0) revert NoLock();
        if (block.timestamp >= lock.unlockTime) revert LockExpired();

        newUnlockTime = _roundToWeek(newUnlockTime);

        if (newUnlockTime <= lock.unlockTime) revert UnlockTimeTooEarly();
        if (newUnlockTime > block.timestamp + MAX_LOCK) revert LockTooLong();

        lock.unlockTime = newUnlockTime;
        emit LockExtended(msg.sender, newUnlockTime);
    }

    /// @notice Withdraw all META after lock has expired.
    function withdraw() external nonReentrant {
        Lock storage lock = locks[msg.sender];
        if (lock.amount == 0) revert NoLock();
        if (block.timestamp < lock.unlockTime) revert LockNotExpired();

        uint256 amount = lock.amount;
        totalLocked -= amount;
        _removeStaker(msg.sender);
        delete locks[msg.sender];

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit Withdrawn(msg.sender, amount);
    }

    // ── Read ─────────────────────────────────────────────────────────────

    /// @notice Current veMETA balance (decays linearly to 0 at unlock time).
    /// @dev    veMETA = amount × (unlockTime − now) / MAX_LOCK
    function balanceOf(address user) external view returns (uint256) {
        Lock memory lock = locks[user];
        if (lock.amount == 0 || block.timestamp >= lock.unlockTime) return 0;
        return (lock.amount * (lock.unlockTime - block.timestamp)) / MAX_LOCK;
    }

    /// @notice veMETA balance at a given timestamp (uses current lock data).
    /// @dev    Approximate if lock was modified after `timestamp`.
    function balanceOfAt(address user, uint256 timestamp) external view returns (uint256) {
        Lock memory lock = locks[user];
        if (lock.amount == 0 || timestamp >= lock.unlockTime) return 0;
        return (lock.amount * (lock.unlockTime - timestamp)) / MAX_LOCK;
    }

    /// @notice Aggregate veMETA supply across all active stakers.
    /// @dev    O(n) iteration — acceptable for testnet scale.
    function totalSupply() external view returns (uint256 total) {
        uint256 len = _stakers.length;
        for (uint256 i; i < len; ++i) {
            Lock memory lock = locks[_stakers[i]];
            if (block.timestamp < lock.unlockTime) {
                total += (lock.amount * (lock.unlockTime - block.timestamp)) / MAX_LOCK;
            }
        }
    }

    /// @notice Number of addresses with active locks.
    function stakerCount() external view returns (uint256) {
        return _stakers.length;
    }

    /// @notice Structured lock info.
    function getLock(address user) external view returns (uint256 amount, uint256 unlockTime) {
        Lock memory lock = locks[user];
        return (lock.amount, lock.unlockTime);
    }

    // ── Internal ─────────────────────────────────────────────────────────

    function _roundToWeek(uint256 ts) internal pure returns (uint256) {
        return (ts / WEEK) * WEEK;
    }

    function _addStaker(address user) internal {
        if (_stakerIdx[user] == 0) {
            _stakers.push(user);
            _stakerIdx[user] = _stakers.length; // 1-indexed
        }
    }

    function _removeStaker(address user) internal {
        uint256 idx = _stakerIdx[user];
        if (idx == 0) return;
        uint256 last = _stakers.length;
        if (idx != last) {
            address tail = _stakers[last - 1];
            _stakers[idx - 1] = tail;
            _stakerIdx[tail] = idx;
        }
        _stakers.pop();
        delete _stakerIdx[user];
    }
}
