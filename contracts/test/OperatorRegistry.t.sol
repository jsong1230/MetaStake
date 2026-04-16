// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {OperatorRegistry} from "../src/OperatorRegistry.sol";

contract OperatorRegistryTest is Test {
    OperatorRegistry public registry;

    address owner = makeAddr("owner");
    address treasuryAddr = makeAddr("treasury");
    address serviceAdmin = makeAddr("serviceAdmin");
    address alice = makeAddr("alice"); // operator
    address bob = makeAddr("bob"); // operator

    uint256 constant MIN_STAKE = 10 ether;
    uint256 constant SLASH_BPS = 1000; // 10%
    uint256 constant COOLDOWN = 7 days;

    function setUp() public {
        vm.prank(owner);
        registry = new OperatorRegistry(treasuryAddr);

        vm.deal(alice, 100_000 ether);
        vm.deal(bob, 100_000 ether);

        // Register a test service
        vm.prank(owner);
        registry.registerService("zkBridge Relayer", serviceAdmin, MIN_STAKE, SLASH_BPS);
    }

    // ── registerService ──────────────────────────────────────────────────

    function test_registerService() public view {
        (string memory name, address admin, uint256 minStake, uint256 slashBps, bool active) =
            registry.getService(0);
        assertEq(name, "zkBridge Relayer");
        assertEq(admin, serviceAdmin);
        assertEq(minStake, MIN_STAKE);
        assertEq(slashBps, SLASH_BPS);
        assertTrue(active);
        assertEq(registry.serviceCount(), 1);
    }

    function test_registerService_multiple() public {
        vm.prank(owner);
        registry.registerService("Dispute Resolver", serviceAdmin, 20 ether, 2000);

        assertEq(registry.serviceCount(), 2);
        (string memory name,,,,) = registry.getService(1);
        assertEq(name, "Dispute Resolver");
    }

    function test_registerService_revert_notOwner() public {
        vm.expectRevert();
        vm.prank(alice);
        registry.registerService("Nope", serviceAdmin, MIN_STAKE, SLASH_BPS);
    }

    function test_registerService_revert_invalidSlashBps() public {
        vm.expectRevert(OperatorRegistry.InvalidSlashBps.selector);
        vm.prank(owner);
        registry.registerService("Bad", serviceAdmin, MIN_STAKE, 10_001);
    }

    // ── updateService ────────────────────────────────────────────────────

    function test_updateService() public {
        vm.prank(owner);
        registry.updateService(0, bob, 20 ether, 500, false);

        (, address admin, uint256 minStake, uint256 slashBps, bool active) = registry.getService(0);
        assertEq(admin, bob);
        assertEq(minStake, 20 ether);
        assertEq(slashBps, 500);
        assertFalse(active);
    }

    // ── stake ────────────────────────────────────────────────────────────

    function test_stake() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        (uint256 stakeAmt,, bool active) = registry.getOperator(0, alice);
        assertEq(stakeAmt, 10 ether);
        assertTrue(active);
        assertEq(registry.operatorCount(0), 1);
    }

    function test_stake_revert_belowMin() public {
        vm.expectRevert(OperatorRegistry.BelowMinStake.selector);
        vm.prank(alice);
        registry.stake{value: 5 ether}(0);
    }

    function test_stake_revert_alreadyOperator() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.expectRevert(OperatorRegistry.AlreadyOperator.selector);
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);
    }

    function test_stake_revert_serviceNotActive() public {
        vm.prank(owner);
        registry.updateService(0, serviceAdmin, MIN_STAKE, SLASH_BPS, false);

        vm.expectRevert(OperatorRegistry.ServiceNotActive.selector);
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);
    }

    // ── increaseStake ────────────────────────────────────────────────────

    function test_increaseStake() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.prank(alice);
        registry.increaseStake{value: 5 ether}(0);

        (uint256 stakeAmt,,) = registry.getOperator(0, alice);
        assertEq(stakeAmt, 15 ether);
    }

    function test_increaseStake_revert_notOperator() public {
        vm.expectRevert(OperatorRegistry.NotOperator.selector);
        vm.prank(alice);
        registry.increaseStake{value: 5 ether}(0);
    }

    // ── requestUnstake + withdraw ────────────────────────────────────────

    function test_unstake_withdraw() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.prank(alice);
        registry.requestUnstake(0);

        // Can't withdraw yet
        vm.expectRevert(OperatorRegistry.CooldownNotElapsed.selector);
        vm.prank(alice);
        registry.withdraw(0);

        // Advance past cooldown
        vm.warp(block.timestamp + COOLDOWN);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        registry.withdraw(0);

        assertEq(alice.balance, balBefore + 10 ether);
        assertEq(registry.operatorCount(0), 0);

        (uint256 stakeAmt,, bool active) = registry.getOperator(0, alice);
        assertEq(stakeAmt, 0);
        assertFalse(active);
    }

    function test_requestUnstake_revert_notOperator() public {
        vm.expectRevert(OperatorRegistry.NotOperator.selector);
        vm.prank(alice);
        registry.requestUnstake(0);
    }

    function test_requestUnstake_revert_alreadyRequested() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.prank(alice);
        registry.requestUnstake(0);

        vm.expectRevert(OperatorRegistry.UnstakeAlreadyRequested.selector);
        vm.prank(alice);
        registry.requestUnstake(0);
    }

    function test_withdraw_revert_noRequest() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.expectRevert(OperatorRegistry.UnstakeNotRequested.selector);
        vm.prank(alice);
        registry.withdraw(0);
    }

    // ── slash ────────────────────────────────────────────────────────────

    function test_slash() public {
        vm.prank(alice);
        registry.stake{value: 100 ether}(0);

        uint256 treasuryBefore = treasuryAddr.balance;

        vm.prank(serviceAdmin);
        registry.slash(0, alice, "late proof submission");

        // 10% of 100 = 10 slashed
        (uint256 stakeAmt,, bool active) = registry.getOperator(0, alice);
        assertEq(stakeAmt, 90 ether);
        assertTrue(active); // still above minStake (10)
        assertEq(treasuryAddr.balance, treasuryBefore + 10 ether);
    }

    function test_slash_deactivatesIfBelowMin() public {
        // Stake exactly minStake
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.prank(serviceAdmin);
        registry.slash(0, alice, "bad proof");

        // 10% of 10 = 1 slashed → remaining 9 < minStake 10 → deactivated
        (uint256 stakeAmt,, bool active) = registry.getOperator(0, alice);
        assertEq(stakeAmt, 9 ether);
        assertFalse(active);
        assertEq(registry.operatorCount(0), 0);
    }

    function test_slash_deactivated_canWithdrawImmediately() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.prank(serviceAdmin);
        registry.slash(0, alice, "bad proof");

        // Deactivated — can withdraw remaining without cooldown
        uint256 balBefore = alice.balance;
        vm.prank(alice);
        registry.withdraw(0);

        assertEq(alice.balance, balBefore + 9 ether);
    }

    function test_slash_multipleSlashes() public {
        vm.prank(alice);
        registry.stake{value: 100 ether}(0);

        vm.prank(serviceAdmin);
        registry.slash(0, alice, "first offense");
        // 90 remaining

        vm.prank(serviceAdmin);
        registry.slash(0, alice, "second offense");
        // 10% of 90 = 9 → 81 remaining

        (uint256 stakeAmt,, bool active) = registry.getOperator(0, alice);
        assertEq(stakeAmt, 81 ether);
        assertTrue(active);
    }

    function test_slash_revert_notServiceAdmin() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.expectRevert(OperatorRegistry.NotServiceAdmin.selector);
        vm.prank(bob);
        registry.slash(0, alice, "unauthorized");
    }

    function test_slash_revert_notOperator() public {
        vm.expectRevert(OperatorRegistry.NotOperator.selector);
        vm.prank(serviceAdmin);
        registry.slash(0, alice, "not staked");
    }

    // ── setTreasury ──────────────────────────────────────────────────────

    function test_setTreasury() public {
        vm.prank(owner);
        registry.setTreasury(bob);
        assertEq(registry.treasury(), bob);
    }

    function test_setTreasury_revert_notOwner() public {
        vm.expectRevert();
        vm.prank(alice);
        registry.setTreasury(bob);
    }

    function test_setTreasury_revert_zero() public {
        vm.expectRevert(OperatorRegistry.ZeroAddress.selector);
        vm.prank(owner);
        registry.setTreasury(address(0));
    }

    // ── Multi-service scenario ───────────────────────────────────────────

    function test_operatorOnMultipleServices() public {
        vm.prank(owner);
        registry.registerService("Dispute Resolver", serviceAdmin, 20 ether, 2000);

        // Alice is operator on both services
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);
        vm.prank(alice);
        registry.stake{value: 20 ether}(1);

        assertEq(registry.operatorCount(0), 1);
        assertEq(registry.operatorCount(1), 1);

        // Slash on service 0 doesn't affect service 1
        vm.prank(serviceAdmin);
        registry.slash(0, alice, "service 0 issue");

        (uint256 stake0,,) = registry.getOperator(0, alice);
        (uint256 stake1,,) = registry.getOperator(1, alice);
        assertEq(stake0, 9 ether); // slashed
        assertEq(stake1, 20 ether); // untouched
    }

    // ── re-stake after withdraw ──────────────────────────────────────────

    function test_restakeAfterWithdraw() public {
        vm.prank(alice);
        registry.stake{value: 10 ether}(0);

        vm.prank(alice);
        registry.requestUnstake(0);
        vm.warp(block.timestamp + COOLDOWN);

        vm.prank(alice);
        registry.withdraw(0);

        // Can stake again
        vm.prank(alice);
        registry.stake{value: 15 ether}(0);

        (uint256 stakeAmt,, bool active) = registry.getOperator(0, alice);
        assertEq(stakeAmt, 15 ether);
        assertTrue(active);
    }
}
