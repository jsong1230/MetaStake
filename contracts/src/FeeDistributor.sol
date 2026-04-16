// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMetaStake {
    function balanceOfAt(address user, uint256 timestamp) external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

/// @title FeeDistributor — weekly fee distribution to veMETA holders
/// @notice Collects native META fees from ecosystem services and distributes
///         them proportionally to veMETA holders on a weekly epoch basis.
/// @dev    Epoch 0 starts at `startTime` (week-aligned). Fees deposited during
///         epoch N are claimable after epoch N ends and is checkpointed.
contract FeeDistributor is ReentrancyGuard {
    // ── Immutables ───────────────────────────────────────────────────────
    IMetaStake public immutable staking;
    uint256 public immutable startTime;

    // ── Constants ────────────────────────────────────────────────────────
    uint256 public constant EPOCH_DURATION = 1 weeks;

    // ── Storage ──────────────────────────────────────────────────────────
    struct Epoch {
        uint256 fees;         // total META collected
        uint256 totalSupply;  // veMETA supply at checkpoint
        uint256 checkpointTs; // timestamp of checkpoint
        bool checkpointed;
    }

    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => mapping(address => bool)) public claimed;

    // ── Events ───────────────────────────────────────────────────────────
    event FeeDeposited(address indexed from, uint256 amount, uint256 indexed epoch);
    event EpochCheckpointed(uint256 indexed epoch, uint256 totalSupply);
    event Claimed(address indexed user, uint256 amount, uint256 fromEpoch, uint256 toEpoch);

    // ── Errors ───────────────────────────────────────────────────────────
    error EpochNotEnded();
    error AlreadyCheckpointed();
    error NothingToClaim();
    error TransferFailed();
    error InvalidRange();

    // ── Constructor ──────────────────────────────────────────────────────
    constructor(address staking_) {
        staking = IMetaStake(staking_);
        startTime = (block.timestamp / EPOCH_DURATION) * EPOCH_DURATION;
    }

    // ── Fee intake ───────────────────────────────────────────────────────

    /// @notice Deposit fees for the current epoch.
    function depositFee() external payable {
        uint256 epoch = currentEpoch();
        epochs[epoch].fees += msg.value;
        emit FeeDeposited(msg.sender, msg.value, epoch);
    }

    /// @notice Accept plain META transfers as fees.
    receive() external payable {
        uint256 epoch = currentEpoch();
        epochs[epoch].fees += msg.value;
        emit FeeDeposited(msg.sender, msg.value, epoch);
    }

    // ── Epoch management ─────────────────────────────────────────────────

    /// @notice Checkpoint a completed epoch. Permissionless.
    /// @dev    Snapshots the current totalSupply of veMETA as the denominator
    ///         for reward calculation. Should be called soon after epoch ends.
    function checkpoint(uint256 epoch) external {
        if (epoch >= currentEpoch()) revert EpochNotEnded();
        if (epochs[epoch].checkpointed) revert AlreadyCheckpointed();

        uint256 supply = staking.totalSupply();
        epochs[epoch].totalSupply = supply;
        epochs[epoch].checkpointTs = block.timestamp;
        epochs[epoch].checkpointed = true;

        emit EpochCheckpointed(epoch, supply);
    }

    // ── Claim ────────────────────────────────────────────────────────────

    /// @notice Claim rewards for a range of epochs [from, to).
    function claim(uint256 from, uint256 to) external nonReentrant returns (uint256 totalReward) {
        uint256 current = currentEpoch();
        if (from >= to || to > current) revert InvalidRange();

        for (uint256 e = from; e < to; ++e) {
            Epoch memory ep = epochs[e];
            if (!ep.checkpointed || ep.totalSupply == 0 || ep.fees == 0) continue;
            if (claimed[e][msg.sender]) continue;

            uint256 userVe = staking.balanceOfAt(msg.sender, ep.checkpointTs);
            if (userVe == 0) continue;

            claimed[e][msg.sender] = true;
            totalReward += (ep.fees * userVe) / ep.totalSupply;
        }

        if (totalReward == 0) revert NothingToClaim();

        (bool ok,) = msg.sender.call{value: totalReward}("");
        if (!ok) revert TransferFailed();

        emit Claimed(msg.sender, totalReward, from, to);
    }

    // ── Read ─────────────────────────────────────────────────────────────

    /// @notice Current epoch number.
    function currentEpoch() public view returns (uint256) {
        return (block.timestamp - startTime) / EPOCH_DURATION;
    }

    /// @notice Preview claimable amount for a range [from, to).
    function claimable(address user, uint256 from, uint256 to) external view returns (uint256 total) {
        uint256 current = currentEpoch();
        if (to > current) to = current;
        for (uint256 e = from; e < to; ++e) {
            Epoch memory ep = epochs[e];
            if (!ep.checkpointed || ep.totalSupply == 0 || ep.fees == 0) continue;
            if (claimed[e][user]) continue;

            uint256 userVe = staking.balanceOfAt(user, ep.checkpointTs);
            if (userVe == 0) continue;

            total += (ep.fees * userVe) / ep.totalSupply;
        }
    }

    /// @notice Start timestamp of a given epoch.
    function epochStartTime(uint256 epoch) external view returns (uint256) {
        return startTime + epoch * EPOCH_DURATION;
    }
}
