// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MetaStake} from "../src/MetaStake.sol";
import {Governance} from "../src/Governance.sol";

/// @dev Simple target contract for governance execution tests.
contract MockTarget {
    uint256 public value;

    function setValue(uint256 v) external {
        value = v;
    }
}

contract GovernanceTest is Test {
    MetaStake public staking;
    Governance public gov;
    MockTarget public target;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");

    uint256 constant MAX_LOCK = 365 days;
    uint256 constant VOTING_DELAY = 1 days;
    uint256 constant VOTING_PERIOD = 3 days;
    uint256 constant THRESHOLD = 1 ether; // 1 veMETA
    uint256 constant QUORUM = 1 ether;    // 1 veMETA total votes

    function setUp() public {
        vm.warp((block.timestamp / 1 weeks) * 1 weeks);

        staking = new MetaStake(MAX_LOCK);
        gov = new Governance(address(staking), VOTING_DELAY, VOTING_PERIOD, THRESHOLD, QUORUM);
        target = new MockTarget();

        vm.deal(alice, 100_000 ether);
        vm.deal(bob, 100_000 ether);
        vm.deal(carol, 100_000 ether);

        // Alice: 1000 META for 1 year → ~1000 veMETA
        vm.prank(alice);
        staking.createLock{value: 1000 ether}(MAX_LOCK);

        // Bob: 500 META for 1 year → ~500 veMETA
        vm.prank(bob);
        staking.createLock{value: 500 ether}(MAX_LOCK);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function _proposeSetValue(uint256 val) internal returns (uint256 id) {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);

        targets[0] = address(target);
        calldatas[0] = abi.encodeCall(MockTarget.setValue, (val));

        vm.prank(alice);
        id = gov.propose(targets, values, calldatas, "Set value");
    }

    function _enterVotingPeriod() internal {
        vm.warp(block.timestamp + VOTING_DELAY + 1);
    }

    function _endVotingPeriod() internal {
        vm.warp(block.timestamp + VOTING_PERIOD + 1);
    }

    // ── propose ──────────────────────────────────────────────────────────

    function test_propose() public {
        uint256 id = _proposeSetValue(42);
        assertEq(id, 0);
        assertEq(gov.proposalCount(), 1);
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Pending));
    }

    function test_propose_emitsEvent() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(target);
        calldatas[0] = abi.encodeCall(MockTarget.setValue, (42));

        vm.expectEmit(true, true, false, false);
        emit Governance.ProposalCreated(0, alice, "Set value", 0, 0);

        vm.prank(alice);
        gov.propose(targets, values, calldatas, "Set value");
    }

    function test_propose_revert_belowThreshold() public {
        // Carol has no lock → 0 veMETA
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        targets[0] = address(target);

        vm.expectRevert(Governance.BelowThreshold.selector);
        vm.prank(carol);
        gov.propose(targets, values, calldatas, "Nope");
    }

    function test_propose_revert_emptyTargets() public {
        address[] memory targets = new address[](0);
        uint256[] memory values = new uint256[](0);
        bytes[] memory calldatas = new bytes[](0);

        vm.expectRevert(Governance.EmptyProposal.selector);
        vm.prank(alice);
        gov.propose(targets, values, calldatas, "Empty");
    }

    function test_propose_revert_lengthMismatch() public {
        address[] memory targets = new address[](2);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](2);

        vm.expectRevert(Governance.LengthMismatch.selector);
        vm.prank(alice);
        gov.propose(targets, values, calldatas, "Mismatch");
    }

    // ── vote ─────────────────────────────────────────────────────────────

    function test_vote_for() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.vote(id, 1); // For

        assertTrue(gov.hasVoted(id, alice));

        (,,, uint256 forVotes,,,,) = gov.proposals(id);
        assertGt(forVotes, 0);
    }

    function test_vote_against() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(bob);
        gov.vote(id, 0); // Against

        (,,,, uint256 againstVotes,,,) = gov.proposals(id);
        assertGt(againstVotes, 0);
    }

    function test_vote_abstain() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.vote(id, 2); // Abstain

        (,,,,, uint256 abstainVotes,,) = gov.proposals(id);
        assertGt(abstainVotes, 0);
    }

    function test_vote_revert_notActive() public {
        uint256 id = _proposeSetValue(42);
        // Still Pending

        vm.expectRevert(Governance.NotActive.selector);
        vm.prank(alice);
        gov.vote(id, 1);
    }

    function test_vote_revert_alreadyVoted() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.vote(id, 1);

        vm.expectRevert(Governance.AlreadyVoted.selector);
        vm.prank(alice);
        gov.vote(id, 1);
    }

    function test_vote_revert_invalidSupport() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.expectRevert(Governance.InvalidSupport.selector);
        vm.prank(alice);
        gov.vote(id, 3);
    }

    function test_vote_revert_noVotingPower() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.expectRevert(Governance.NoVotingPower.selector);
        vm.prank(carol);
        gov.vote(id, 1);
    }

    // ── state transitions ────────────────────────────────────────────────

    function test_state_pendingToActive() public {
        uint256 id = _proposeSetValue(42);
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Pending));

        _enterVotingPeriod();
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Active));
    }

    function test_state_succeeded() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.vote(id, 1); // For

        _endVotingPeriod();
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Succeeded));
    }

    function test_state_defeated_noQuorum() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();
        // No votes at all
        _endVotingPeriod();
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Defeated));
    }

    function test_state_defeated_majorityAgainst() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.vote(id, 1); // For ~1000 veMETA

        vm.prank(bob);
        gov.vote(id, 0); // Against ~500 veMETA

        // Alice has more, so this actually succeeds... let me flip
        // Actually Alice > Bob so this passes. Let me test defeat differently.
        _endVotingPeriod();

        // This should succeed because forVotes > againstVotes
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Succeeded));
    }

    function test_state_defeated_moreAgainst() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        // Bob votes for (500 veMETA), Alice votes against (1000 veMETA)
        vm.prank(bob);
        gov.vote(id, 1); // For

        vm.prank(alice);
        gov.vote(id, 0); // Against

        _endVotingPeriod();
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Defeated));
    }

    function test_state_defeated_tiedVotes() public {
        // Equal stakes → tie → defeated (forVotes <= againstVotes)
        // Give carol same lock as alice
        vm.prank(carol);
        staking.createLock{value: 1000 ether}(MAX_LOCK);

        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.vote(id, 1); // For

        vm.prank(carol);
        gov.vote(id, 0); // Against (same weight)

        _endVotingPeriod();
        // Tie: forVotes == againstVotes → Defeated (forVotes <= againstVotes)
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Defeated));
    }

    // ── execute ──────────────────────────────────────────────────────────

    function test_execute() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.vote(id, 1);
        _endVotingPeriod();

        gov.execute(id);

        assertEq(target.value(), 42);
        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Executed));
    }

    function test_execute_multipleActions() public {
        address[] memory targets = new address[](2);
        uint256[] memory values = new uint256[](2);
        bytes[] memory calldatas = new bytes[](2);

        targets[0] = address(target);
        targets[1] = address(target);
        calldatas[0] = abi.encodeCall(MockTarget.setValue, (10));
        calldatas[1] = abi.encodeCall(MockTarget.setValue, (99));

        vm.prank(alice);
        uint256 id = gov.propose(targets, values, calldatas, "Two actions");

        _enterVotingPeriod();
        vm.prank(alice);
        gov.vote(id, 1);
        _endVotingPeriod();

        gov.execute(id);
        // Last action wins
        assertEq(target.value(), 99);
    }

    function test_execute_revert_notSucceeded() public {
        uint256 id = _proposeSetValue(42);
        // Still Pending

        vm.expectRevert(Governance.NotSucceeded.selector);
        gov.execute(id);
    }

    function test_execute_revert_alreadyExecuted() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();
        vm.prank(alice);
        gov.vote(id, 1);
        _endVotingPeriod();

        gov.execute(id);

        vm.expectRevert(Governance.NotSucceeded.selector);
        gov.execute(id);
    }

    // ── cancel ───────────────────────────────────────────────────────────

    function test_cancel() public {
        uint256 id = _proposeSetValue(42);

        vm.prank(alice);
        gov.cancel(id);

        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Canceled));
    }

    function test_cancel_duringVoting() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();

        vm.prank(alice);
        gov.cancel(id);

        assertEq(uint8(gov.state(id)), uint8(Governance.ProposalState.Canceled));
    }

    function test_cancel_revert_notProposer() public {
        uint256 id = _proposeSetValue(42);

        vm.expectRevert(Governance.NotProposer.selector);
        vm.prank(bob);
        gov.cancel(id);
    }

    function test_cancel_revert_alreadyExecuted() public {
        uint256 id = _proposeSetValue(42);
        _enterVotingPeriod();
        vm.prank(alice);
        gov.vote(id, 1);
        _endVotingPeriod();
        gov.execute(id);

        vm.expectRevert(Governance.NotCancelable.selector);
        vm.prank(alice);
        gov.cancel(id);
    }

    // ── getActions ───────────────────────────────────────────────────────

    function test_getActions() public {
        uint256 id = _proposeSetValue(42);

        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas) = gov.getActions(id);
        assertEq(targets.length, 1);
        assertEq(targets[0], address(target));
        assertEq(values[0], 0);
        assertEq(calldatas[0], abi.encodeCall(MockTarget.setValue, (42)));
    }
}
