// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMetaStake {
    function balanceOf(address user) external view returns (uint256);
}

/// @title Governance — veMETA-weighted proposal & voting
/// @notice veMETA holders can create proposals, vote, and execute approved
///         on-chain actions (parameter changes, treasury transfers, etc.).
/// @dev    Simplified Governor — uses live veMETA balance at vote time.
///         For production, replace with checkpoint-based past-votes.
contract Governance {
    // ── Immutables ───────────────────────────────────────────────────────
    IMetaStake public immutable staking;
    uint256 public immutable votingDelay;       // seconds before voting starts
    uint256 public immutable votingPeriod;      // seconds voting is open
    uint256 public immutable proposalThreshold; // min veMETA to create proposal
    uint256 public immutable quorum;            // min total votes for validity

    // ── Types ────────────────────────────────────────────────────────────
    enum ProposalState {
        Pending,
        Active,
        Defeated,
        Succeeded,
        Executed,
        Canceled
    }

    struct Proposal {
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool canceled;
    }

    struct Actions {
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
    }

    // ── Storage ──────────────────────────────────────────────────────────
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => Actions) private _actions;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;

    // ── Events ───────────────────────────────────────────────────────────
    event ProposalCreated(
        uint256 indexed id, address indexed proposer, string description, uint256 startTime, uint256 endTime
    );
    event Voted(uint256 indexed id, address indexed voter, uint8 support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalCanceled(uint256 indexed id);

    // ── Errors ───────────────────────────────────────────────────────────
    error BelowThreshold();
    error EmptyProposal();
    error LengthMismatch();
    error NotActive();
    error AlreadyVoted();
    error InvalidSupport();
    error NoVotingPower();
    error NotSucceeded();
    error ExecutionFailed();
    error NotProposer();
    error NotCancelable();

    // ── Constructor ──────────────────────────────────────────────────────
    constructor(
        address staking_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 proposalThreshold_,
        uint256 quorum_
    ) {
        staking = IMetaStake(staking_);
        votingDelay = votingDelay_;
        votingPeriod = votingPeriod_;
        proposalThreshold = proposalThreshold_;
        quorum = quorum_;
    }

    // ── Propose ──────────────────────────────────────────────────────────

    /// @notice Create a new proposal.
    /// @param targets  Contract addresses to call.
    /// @param values   Native META to send with each call.
    /// @param calldatas Encoded function calls.
    /// @param description Human-readable description.
    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external returns (uint256 id) {
        if (staking.balanceOf(msg.sender) < proposalThreshold) revert BelowThreshold();
        if (targets.length == 0) revert EmptyProposal();
        if (targets.length != values.length || targets.length != calldatas.length) revert LengthMismatch();

        id = proposalCount++;
        uint256 start = block.timestamp + votingDelay;
        uint256 end = start + votingPeriod;

        proposals[id] = Proposal({
            proposer: msg.sender,
            startTime: start,
            endTime: end,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            executed: false,
            canceled: false
        });

        Actions storage a = _actions[id];
        for (uint256 i; i < targets.length; ++i) {
            a.targets.push(targets[i]);
            a.values.push(values[i]);
            a.calldatas.push(calldatas[i]);
        }

        emit ProposalCreated(id, msg.sender, description, start, end);
    }

    // ── Vote ─────────────────────────────────────────────────────────────

    /// @notice Cast a vote.
    /// @param proposalId Proposal to vote on.
    /// @param support    0 = Against, 1 = For, 2 = Abstain.
    function vote(uint256 proposalId, uint8 support) external {
        if (state(proposalId) != ProposalState.Active) revert NotActive();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();
        if (support > 2) revert InvalidSupport();

        uint256 weight = staking.balanceOf(msg.sender);
        if (weight == 0) revert NoVotingPower();

        hasVoted[proposalId][msg.sender] = true;

        Proposal storage p = proposals[proposalId];
        if (support == 0) p.againstVotes += weight;
        else if (support == 1) p.forVotes += weight;
        else p.abstainVotes += weight;

        emit Voted(proposalId, msg.sender, support, weight);
    }

    // ── Execute ──────────────────────────────────────────────────────────

    /// @notice Execute a succeeded proposal.
    function execute(uint256 proposalId) external payable {
        if (state(proposalId) != ProposalState.Succeeded) revert NotSucceeded();

        proposals[proposalId].executed = true;

        Actions storage a = _actions[proposalId];
        for (uint256 i; i < a.targets.length; ++i) {
            (bool ok,) = a.targets[i].call{value: a.values[i]}(a.calldatas[i]);
            if (!ok) revert ExecutionFailed();
        }

        emit ProposalExecuted(proposalId);
    }

    // ── Cancel ───────────────────────────────────────────────────────────

    /// @notice Proposer can cancel before execution.
    function cancel(uint256 proposalId) external {
        if (msg.sender != proposals[proposalId].proposer) revert NotProposer();
        ProposalState s = state(proposalId);
        if (s == ProposalState.Executed || s == ProposalState.Canceled) revert NotCancelable();

        proposals[proposalId].canceled = true;
        emit ProposalCanceled(proposalId);
    }

    // ── Read ─────────────────────────────────────────────────────────────

    /// @notice Current state of a proposal.
    function state(uint256 proposalId) public view returns (ProposalState) {
        Proposal memory p = proposals[proposalId];

        if (p.canceled) return ProposalState.Canceled;
        if (p.executed) return ProposalState.Executed;
        if (block.timestamp < p.startTime) return ProposalState.Pending;
        if (block.timestamp <= p.endTime) return ProposalState.Active;

        // Voting ended
        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        if (totalVotes < quorum || p.forVotes <= p.againstVotes) {
            return ProposalState.Defeated;
        }
        return ProposalState.Succeeded;
    }

    /// @notice Get proposal actions.
    function getActions(uint256 proposalId)
        external
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        Actions storage a = _actions[proposalId];
        return (a.targets, a.values, a.calldatas);
    }

    /// @notice Accept META for proposal execution.
    receive() external payable {}
}
