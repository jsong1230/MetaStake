// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MetaStake} from "../src/MetaStake.sol";
import {FeeDistributor} from "../src/FeeDistributor.sol";

contract FeeDistributorTest is Test {
    MetaStake public staking;
    FeeDistributor public dist;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address service = makeAddr("service"); // simulates MetaPool/MetaLotto

    uint256 constant MAX_LOCK = 365 days;
    uint256 constant WEEK = 1 weeks;

    function setUp() public {
        // Align to week boundary so epoch math is clean
        vm.warp((block.timestamp / WEEK) * WEEK);

        staking = new MetaStake(MAX_LOCK);
        dist = new FeeDistributor(address(staking));

        vm.deal(alice, 100_000 ether);
        vm.deal(bob, 100_000 ether);
        vm.deal(service, 100_000 ether);
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function _lock(address user, uint256 amount, uint256 duration) internal {
        vm.prank(user);
        staking.createLock{value: amount}(duration);
    }

    function _depositFee(uint256 amount) internal {
        vm.prank(service);
        dist.depositFee{value: amount}();
    }

    function _advanceEpoch() internal {
        vm.warp(block.timestamp + WEEK);
    }

    // ── depositFee ───────────────────────────────────────────────────────

    function test_depositFee() public {
        _depositFee(10 ether);

        (uint256 fees,,,) = dist.epochs(0);
        assertEq(fees, 10 ether);
        assertEq(address(dist).balance, 10 ether);
    }

    function test_depositFee_viaReceive() public {
        vm.prank(service);
        (bool ok,) = address(dist).call{value: 5 ether}("");
        assertTrue(ok);

        (uint256 fees,,,) = dist.epochs(0);
        assertEq(fees, 5 ether);
    }

    function test_depositFee_accumulates() public {
        _depositFee(3 ether);
        _depositFee(7 ether);

        (uint256 fees,,,) = dist.epochs(0);
        assertEq(fees, 10 ether);
    }

    function test_depositFee_separateEpochs() public {
        _depositFee(10 ether);
        _advanceEpoch();
        _depositFee(20 ether);

        (uint256 fees0,,,) = dist.epochs(0);
        (uint256 fees1,,,) = dist.epochs(1);
        assertEq(fees0, 10 ether);
        assertEq(fees1, 20 ether);
    }

    // ── checkpoint ───────────────────────────────────────────────────────

    function test_checkpoint() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        _depositFee(10 ether);

        _advanceEpoch();
        dist.checkpoint(0);

        (, uint256 totalSupply,, bool checkpointed) = dist.epochs(0);
        assertTrue(checkpointed);
        assertGt(totalSupply, 0);
    }

    function test_checkpoint_revert_epochNotEnded() public {
        _depositFee(10 ether);

        vm.expectRevert(FeeDistributor.EpochNotEnded.selector);
        dist.checkpoint(0);
    }

    function test_checkpoint_revert_alreadyCheckpointed() public {
        _depositFee(10 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        vm.expectRevert(FeeDistributor.AlreadyCheckpointed.selector);
        dist.checkpoint(0);
    }

    // ── claim (single user) ──────────────────────────────────────────────

    function test_claim_singleUser() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        _depositFee(10 ether);

        _advanceEpoch();
        dist.checkpoint(0);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        dist.claim(0, 1);

        assertGt(alice.balance, balBefore);
        // Single staker gets all fees (minus rounding)
        assertApproxEqRel(alice.balance - balBefore, 10 ether, 0.01e18);
    }

    function test_claim_revert_nothingToClaim() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        // No fees deposited
        _advanceEpoch();
        dist.checkpoint(0);

        vm.expectRevert(FeeDistributor.NothingToClaim.selector);
        vm.prank(alice);
        dist.claim(0, 1);
    }

    function test_claim_revert_doubleClaim() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        _depositFee(10 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        vm.prank(alice);
        dist.claim(0, 1);

        vm.expectRevert(FeeDistributor.NothingToClaim.selector);
        vm.prank(alice);
        dist.claim(0, 1);
    }

    function test_claim_revert_invalidRange() public {
        vm.expectRevert(FeeDistributor.InvalidRange.selector);
        vm.prank(alice);
        dist.claim(1, 0); // from > to

        vm.expectRevert(FeeDistributor.InvalidRange.selector);
        vm.prank(alice);
        dist.claim(0, 1); // epoch 0 not ended yet
    }

    function test_claim_noLockUser() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        _depositFee(10 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        // Bob has no lock
        vm.expectRevert(FeeDistributor.NothingToClaim.selector);
        vm.prank(bob);
        dist.claim(0, 1);
    }

    // ── claim (multi-user proportional) ──────────────────────────────────

    function test_claim_proportional() public {
        // Alice: 1000 META for full year → ~1000 veMETA
        // Bob:   1000 META for half year → ~500 veMETA
        // Ratio: Alice gets ~2/3, Bob gets ~1/3
        _lock(alice, 1000 ether, MAX_LOCK);
        _lock(bob, 1000 ether, MAX_LOCK / 2);

        _depositFee(30 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        vm.prank(alice);
        uint256 aliceReward = dist.claim(0, 1);
        vm.prank(bob);
        uint256 bobReward = dist.claim(0, 1);

        // Alice should get roughly 2x Bob's reward
        assertApproxEqRel(aliceReward, bobReward * 2, 0.05e18); // 5% tolerance
        // Total distributed ≈ total fees
        assertApproxEqRel(aliceReward + bobReward, 30 ether, 0.01e18);
    }

    function test_claim_equalStakes() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        _lock(bob, 1000 ether, MAX_LOCK);

        _depositFee(20 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        vm.prank(alice);
        uint256 aliceReward = dist.claim(0, 1);
        vm.prank(bob);
        uint256 bobReward = dist.claim(0, 1);

        // Equal stakes → equal rewards
        assertEq(aliceReward, bobReward);
        assertApproxEqRel(aliceReward + bobReward, 20 ether, 0.01e18);
    }

    // ── multi-epoch claim ────────────────────────────────────────────────

    function test_claim_multipleEpochs() public {
        _lock(alice, 1000 ether, MAX_LOCK);

        // Epoch 0: 10 META fees
        _depositFee(10 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        // Epoch 1: 20 META fees
        _depositFee(20 ether);
        _advanceEpoch();
        dist.checkpoint(1);

        // Claim both epochs at once
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        dist.claim(0, 2);

        uint256 reward = alice.balance - balBefore;
        // Should receive ~30 META total (sole staker)
        assertApproxEqRel(reward, 30 ether, 0.01e18);
    }

    // ── claimable view ───────────────────────────────────────────────────

    function test_claimable() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        _depositFee(10 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        uint256 preview = dist.claimable(alice, 0, 1);
        assertGt(preview, 0);

        vm.prank(alice);
        uint256 actual = dist.claim(0, 1);
        assertEq(preview, actual);
    }

    function test_claimable_afterClaim_isZero() public {
        _lock(alice, 1000 ether, MAX_LOCK);
        _depositFee(10 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        vm.prank(alice);
        dist.claim(0, 1);

        assertEq(dist.claimable(alice, 0, 1), 0);
    }

    // ── epoch helpers ────────────────────────────────────────────────────

    function test_currentEpoch() public {
        assertEq(dist.currentEpoch(), 0);
        _advanceEpoch();
        assertEq(dist.currentEpoch(), 1);
        _advanceEpoch();
        assertEq(dist.currentEpoch(), 2);
    }

    function test_epochStartTime() public view {
        assertEq(dist.epochStartTime(0), dist.startTime());
        assertEq(dist.epochStartTime(1), dist.startTime() + WEEK);
    }

    // ── skipped epoch (no fees) ──────────────────────────────────────────

    function test_claim_skipsEmptyEpochs() public {
        _lock(alice, 1000 ether, MAX_LOCK);

        // Epoch 0: fees
        _depositFee(10 ether);
        _advanceEpoch();
        dist.checkpoint(0);

        // Epoch 1: no fees
        _advanceEpoch();
        dist.checkpoint(1);

        // Epoch 2: fees
        _depositFee(15 ether);
        _advanceEpoch();
        dist.checkpoint(2);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        dist.claim(0, 3);

        uint256 reward = alice.balance - balBefore;
        // Should get ~25 META (epoch 0 + epoch 2, epoch 1 skipped)
        assertApproxEqRel(reward, 25 ether, 0.01e18);
    }
}
