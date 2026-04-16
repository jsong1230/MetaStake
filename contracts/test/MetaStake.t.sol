// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MetaStake} from "../src/MetaStake.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockMETA is ERC20 {
    constructor() ERC20("META Token", "META") {
        _mint(msg.sender, 1_000_000 ether);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract MetaStakeTest is Test {
    MetaStake public staking;
    MockMETA public meta;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    uint256 constant MAX_LOCK = 365 days;
    uint256 constant WEEK = 1 weeks;

    function setUp() public {
        meta = new MockMETA();
        staking = new MetaStake(address(meta), MAX_LOCK);

        meta.mint(alice, 10_000 ether);
        meta.mint(bob, 10_000 ether);

        vm.prank(alice);
        meta.approve(address(staking), type(uint256).max);
        vm.prank(bob);
        meta.approve(address(staking), type(uint256).max);
    }

    // ─── createLock ──────────────────────────────────────────────────────

    function test_createLock() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        (uint256 amount, uint256 unlockTime) = staking.getLock(alice);
        assertEq(amount, 1000 ether);
        // unlockTime is rounded down to week
        uint256 expected = ((block.timestamp + 26 weeks) / WEEK) * WEEK;
        assertEq(unlockTime, expected);
        assertEq(staking.totalLocked(), 1000 ether);
    }

    function test_createLock_emitsEvent() public {
        uint256 expectedUnlock = ((block.timestamp + 26 weeks) / WEEK) * WEEK;

        vm.expectEmit(true, false, false, true);
        emit MetaStake.Locked(alice, 1000 ether, expectedUnlock);

        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);
    }

    function test_createLock_transfersTokens() public {
        uint256 balBefore = meta.balanceOf(alice);

        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        assertEq(meta.balanceOf(alice), balBefore - 1000 ether);
        assertEq(meta.balanceOf(address(staking)), 1000 ether);
    }

    function test_createLock_revert_zeroAmount() public {
        vm.expectRevert(MetaStake.ZeroAmount.selector);
        vm.prank(alice);
        staking.createLock(0, 26 weeks);
    }

    function test_createLock_revert_tooShort() public {
        vm.expectRevert(MetaStake.LockTooShort.selector);
        vm.prank(alice);
        staking.createLock(1000 ether, 1 days);
    }

    function test_createLock_revert_tooLong() public {
        vm.expectRevert(MetaStake.LockTooLong.selector);
        vm.prank(alice);
        staking.createLock(1000 ether, MAX_LOCK + 1);
    }

    function test_createLock_revert_duplicate() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        vm.expectRevert(MetaStake.LockExists.selector);
        vm.prank(alice);
        staking.createLock(500 ether, 26 weeks);
    }

    // ─── balanceOf (veMETA) ──────────────────────────────────────────────

    function test_balanceOf_maxLock() public {
        vm.prank(alice);
        staking.createLock(1000 ether, MAX_LOCK);

        // At max lock, veMETA ≈ amount (minus rounding from week floor).
        // Week rounding can shave up to 6 days off unlockTime → ~98.4% minimum.
        uint256 bal = staking.balanceOf(alice);
        assertGt(bal, 980 ether);
        assertLe(bal, 1000 ether);
    }

    function test_balanceOf_decaysLinearly() public {
        vm.prank(alice);
        staking.createLock(1000 ether, MAX_LOCK);

        uint256 balStart = staking.balanceOf(alice);

        // Warp to halfway
        vm.warp(block.timestamp + MAX_LOCK / 2);
        uint256 balMid = staking.balanceOf(alice);

        // Mid balance should be roughly half of start
        assertApproxEqRel(balMid, balStart / 2, 0.01e18); // 1% tolerance

        // Warp to just before unlock
        (, uint256 unlockTime) = staking.getLock(alice);
        vm.warp(unlockTime - 1);
        uint256 balEnd = staking.balanceOf(alice);
        assertLt(balEnd, 1 ether); // near zero
    }

    function test_balanceOf_zeroAfterExpiry() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        (, uint256 unlockTime) = staking.getLock(alice);
        vm.warp(unlockTime);

        assertEq(staking.balanceOf(alice), 0);
    }

    function test_balanceOf_noLock() public view {
        assertEq(staking.balanceOf(alice), 0);
    }

    // ─── increaseAmount ──────────────────────────────────────────────────

    function test_increaseAmount() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        vm.prank(alice);
        staking.increaseAmount(500 ether);

        (uint256 amount,) = staking.getLock(alice);
        assertEq(amount, 1500 ether);
        assertEq(staking.totalLocked(), 1500 ether);
    }

    function test_increaseAmount_revert_noLock() public {
        vm.expectRevert(MetaStake.NoLock.selector);
        vm.prank(alice);
        staking.increaseAmount(500 ether);
    }

    function test_increaseAmount_revert_expired() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 1 weeks);

        (, uint256 unlockTime) = staking.getLock(alice);
        vm.warp(unlockTime);

        vm.expectRevert(MetaStake.LockExpired.selector);
        vm.prank(alice);
        staking.increaseAmount(500 ether);
    }

    function test_increaseAmount_revert_zeroAmount() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        vm.expectRevert(MetaStake.ZeroAmount.selector);
        vm.prank(alice);
        staking.increaseAmount(0);
    }

    // ─── extendLock ──────────────────────────────────────────────────────

    function test_extendLock() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 13 weeks);

        (, uint256 oldUnlock) = staking.getLock(alice);

        uint256 newUnlock = oldUnlock + 13 weeks;
        vm.prank(alice);
        staking.extendLock(newUnlock);

        (, uint256 updatedUnlock) = staking.getLock(alice);
        assertEq(updatedUnlock, (newUnlock / WEEK) * WEEK);
        assertGt(updatedUnlock, oldUnlock);
    }

    function test_extendLock_increasesVeMETA() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 13 weeks);

        uint256 balBefore = staking.balanceOf(alice);

        (, uint256 oldUnlock) = staking.getLock(alice);
        vm.prank(alice);
        staking.extendLock(oldUnlock + 13 weeks);

        uint256 balAfter = staking.balanceOf(alice);
        assertGt(balAfter, balBefore);
    }

    function test_extendLock_revert_noLock() public {
        vm.expectRevert(MetaStake.NoLock.selector);
        vm.prank(alice);
        staking.extendLock(block.timestamp + 26 weeks);
    }

    function test_extendLock_revert_expired() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 1 weeks);

        (, uint256 unlockTime) = staking.getLock(alice);
        vm.warp(unlockTime);

        vm.expectRevert(MetaStake.LockExpired.selector);
        vm.prank(alice);
        staking.extendLock(block.timestamp + 26 weeks);
    }

    function test_extendLock_revert_notLater() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        (, uint256 currentUnlock) = staking.getLock(alice);

        vm.expectRevert(MetaStake.UnlockTimeTooEarly.selector);
        vm.prank(alice);
        staking.extendLock(currentUnlock - 1 weeks);
    }

    function test_extendLock_revert_exceedsMax() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        vm.expectRevert(MetaStake.LockTooLong.selector);
        vm.prank(alice);
        staking.extendLock(block.timestamp + MAX_LOCK + 4 weeks);
    }

    // ─── withdraw ────────────────────────────────────────────────────────

    function test_withdraw() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 1 weeks);

        (, uint256 unlockTime) = staking.getLock(alice);
        vm.warp(unlockTime);

        uint256 balBefore = meta.balanceOf(alice);

        vm.prank(alice);
        staking.withdraw();

        assertEq(meta.balanceOf(alice), balBefore + 1000 ether);
        assertEq(staking.totalLocked(), 0);

        (uint256 amount,) = staking.getLock(alice);
        assertEq(amount, 0);
    }

    function test_withdraw_revert_notExpired() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 26 weeks);

        vm.expectRevert(MetaStake.LockNotExpired.selector);
        vm.prank(alice);
        staking.withdraw();
    }

    function test_withdraw_revert_noLock() public {
        vm.expectRevert(MetaStake.NoLock.selector);
        vm.prank(alice);
        staking.withdraw();
    }

    function test_withdraw_canRelockAfter() public {
        vm.prank(alice);
        staking.createLock(1000 ether, 1 weeks);

        (, uint256 unlockTime) = staking.getLock(alice);
        vm.warp(unlockTime);

        vm.prank(alice);
        staking.withdraw();

        // Should be able to create a new lock
        vm.prank(alice);
        staking.createLock(500 ether, 4 weeks);

        (uint256 amount,) = staking.getLock(alice);
        assertEq(amount, 500 ether);
    }

    // ─── Multi-user scenario ─────────────────────────────────────────────

    function test_multipleUsers() public {
        vm.prank(alice);
        staking.createLock(1000 ether, MAX_LOCK);

        vm.prank(bob);
        staking.createLock(2000 ether, MAX_LOCK / 2);

        assertEq(staking.totalLocked(), 3000 ether);

        // Alice has higher veMETA per token (longer lock)
        uint256 aliceVe = staking.balanceOf(alice);
        uint256 bobVe = staking.balanceOf(bob);

        // Alice locked 1000 for full year ≈ 1000 veMETA
        // Bob locked 2000 for half year ≈ 1000 veMETA
        assertApproxEqRel(aliceVe, bobVe, 0.02e18); // within 2%
    }
}
