// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title OperatorRegistry — service operator staking & slashing
/// @notice Operators stake native META to run ecosystem services (zkBridge
///         relayer, dispute resolver, agent verifier, etc.). Misbehaviour
///         triggers slashing; slashed META goes to the treasury.
contract OperatorRegistry is Ownable, ReentrancyGuard {
    // ── Constants ────────────────────────────────────────────────────────
    uint256 public constant UNSTAKE_COOLDOWN = 7 days;
    uint256 public constant BASIS_POINTS = 10_000;

    // ── Types ────────────────────────────────────────────────────────────
    struct Service {
        string name;
        address admin; // can slash operators
        uint256 minStake;
        uint256 slashBps; // e.g. 1000 = 10%
        bool active;
    }

    struct Operator {
        uint256 stake;
        uint256 unstakeRequestTime; // 0 = not requested
        bool active;
    }

    // ── Storage ──────────────────────────────────────────────────────────
    mapping(uint256 => Service) public services;
    uint256 public serviceCount;

    mapping(uint256 => mapping(address => Operator)) public operators;
    mapping(uint256 => uint256) public operatorCount;

    address public treasury;

    // ── Events ───────────────────────────────────────────────────────────
    event ServiceRegistered(uint256 indexed id, string name, address admin, uint256 minStake, uint256 slashBps);
    event ServiceUpdated(uint256 indexed id);
    event OperatorStaked(uint256 indexed serviceId, address indexed operator, uint256 amount);
    event StakeIncreased(uint256 indexed serviceId, address indexed operator, uint256 added, uint256 newTotal);
    event UnstakeRequested(uint256 indexed serviceId, address indexed operator, uint256 availableAt);
    event OperatorWithdrawn(uint256 indexed serviceId, address indexed operator, uint256 amount);
    event OperatorSlashed(
        uint256 indexed serviceId, address indexed operator, uint256 slashedAmount, string reason
    );
    event TreasuryUpdated(address newTreasury);

    // ── Errors ───────────────────────────────────────────────────────────
    error ServiceNotActive();
    error BelowMinStake();
    error AlreadyOperator();
    error NotOperator();
    error UnstakeNotRequested();
    error CooldownNotElapsed();
    error UnstakeAlreadyRequested();
    error NotServiceAdmin();
    error ZeroAddress();
    error ZeroAmount();
    error TransferFailed();
    error InvalidSlashBps();
    error NoStake();

    // ── Constructor ──────────────────────────────────────────────────────
    constructor(address treasury_) Ownable(msg.sender) {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
    }

    // ── Service Management (owner only) ──────────────────────────────────

    /// @notice Register a new service.
    function registerService(string calldata name, address admin, uint256 minStake, uint256 slashBps)
        external
        onlyOwner
        returns (uint256 id)
    {
        if (admin == address(0)) revert ZeroAddress();
        if (slashBps > BASIS_POINTS) revert InvalidSlashBps();

        id = serviceCount++;
        services[id] =
            Service({name: name, admin: admin, minStake: minStake, slashBps: slashBps, active: true});

        emit ServiceRegistered(id, name, admin, minStake, slashBps);
    }

    /// @notice Update service parameters.
    function updateService(uint256 serviceId, address admin, uint256 minStake, uint256 slashBps, bool active)
        external
        onlyOwner
    {
        if (admin == address(0)) revert ZeroAddress();
        if (slashBps > BASIS_POINTS) revert InvalidSlashBps();

        Service storage s = services[serviceId];
        s.admin = admin;
        s.minStake = minStake;
        s.slashBps = slashBps;
        s.active = active;

        emit ServiceUpdated(serviceId);
    }

    /// @notice Update treasury address.
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    // ── Operator Lifecycle ───────────────────────────────────────────────

    /// @notice Become an operator for a service by staking META.
    function stake(uint256 serviceId) external payable nonReentrant {
        Service memory s = services[serviceId];
        if (!s.active) revert ServiceNotActive();
        if (msg.value < s.minStake) revert BelowMinStake();

        Operator storage op = operators[serviceId][msg.sender];
        if (op.active) revert AlreadyOperator();

        op.stake = msg.value;
        op.active = true;
        op.unstakeRequestTime = 0;
        operatorCount[serviceId]++;

        emit OperatorStaked(serviceId, msg.sender, msg.value);
    }

    /// @notice Add more META to an active operator position.
    function increaseStake(uint256 serviceId) external payable nonReentrant {
        if (msg.value == 0) revert ZeroAmount();
        Operator storage op = operators[serviceId][msg.sender];
        if (!op.active) revert NotOperator();

        op.stake += msg.value;
        emit StakeIncreased(serviceId, msg.sender, msg.value, op.stake);
    }

    /// @notice Request to unstake. Starts UNSTAKE_COOLDOWN timer.
    function requestUnstake(uint256 serviceId) external {
        Operator storage op = operators[serviceId][msg.sender];
        if (!op.active) revert NotOperator();
        if (op.unstakeRequestTime != 0) revert UnstakeAlreadyRequested();

        op.unstakeRequestTime = block.timestamp;
        emit UnstakeRequested(serviceId, msg.sender, block.timestamp + UNSTAKE_COOLDOWN);
    }

    /// @notice Withdraw staked META.
    ///         Active operators must wait for cooldown after requestUnstake.
    ///         Deactivated operators (slashed below min) can withdraw immediately.
    function withdraw(uint256 serviceId) external nonReentrant {
        Operator storage op = operators[serviceId][msg.sender];
        if (op.stake == 0) revert NoStake();

        if (op.active) {
            if (op.unstakeRequestTime == 0) revert UnstakeNotRequested();
            if (block.timestamp < op.unstakeRequestTime + UNSTAKE_COOLDOWN) revert CooldownNotElapsed();
            operatorCount[serviceId]--;
        }

        uint256 amount = op.stake;
        delete operators[serviceId][msg.sender];

        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert TransferFailed();

        emit OperatorWithdrawn(serviceId, msg.sender, amount);
    }

    // ── Slashing ─────────────────────────────────────────────────────────

    /// @notice Slash an operator. Only callable by the service admin.
    ///         If remaining stake falls below minStake, operator is deactivated.
    function slash(uint256 serviceId, address operator, string calldata reason) external nonReentrant {
        Service memory s = services[serviceId];
        if (msg.sender != s.admin) revert NotServiceAdmin();

        Operator storage op = operators[serviceId][operator];
        if (!op.active) revert NotOperator();

        uint256 slashAmount = (op.stake * s.slashBps) / BASIS_POINTS;
        op.stake -= slashAmount;

        if (op.stake < s.minStake) {
            op.active = false;
            operatorCount[serviceId]--;
        }

        (bool ok,) = treasury.call{value: slashAmount}("");
        if (!ok) revert TransferFailed();

        emit OperatorSlashed(serviceId, operator, slashAmount, reason);
    }

    // ── Read ─────────────────────────────────────────────────────────────

    /// @notice Get operator info.
    function getOperator(uint256 serviceId, address operator)
        external
        view
        returns (uint256 stakeAmount, uint256 unstakeRequestTime, bool active)
    {
        Operator memory op = operators[serviceId][operator];
        return (op.stake, op.unstakeRequestTime, op.active);
    }

    /// @notice Get service info.
    function getService(uint256 serviceId)
        external
        view
        returns (string memory name, address admin, uint256 minStake, uint256 slashBps, bool active)
    {
        Service memory s = services[serviceId];
        return (s.name, s.admin, s.minStake, s.slashBps, s.active);
    }
}
