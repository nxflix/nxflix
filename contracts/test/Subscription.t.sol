// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {Subscription} from "../src/Subscription.sol";
import {ISubscription} from "../src/interfaces/ISubscription.sol";

contract SubscriptionTest is Test {
    Subscription public subscription;

    address public owner = address(this);
    address public treasury = makeAddr("treasury");
    address public user1 = makeAddr("user1");
    address public user2 = makeAddr("user2");

    uint256 constant MONTHLY_PRICE = 0.01 ether;
    uint256 constant QUARTERLY_PRICE = 0.025 ether;
    uint256 constant YEARLY_PRICE = 0.08 ether;

    function setUp() public {
        subscription = new Subscription(treasury);

        // Fund test users
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // ============================================================
    //                      DEPLOYMENT TESTS
    // ============================================================

    function test_Deployment() public view {
        assertEq(subscription.owner(), owner);
        assertEq(subscription.treasury(), treasury);
        assertEq(subscription.planCount(), 3);
    }

    function test_DefaultPlans() public view {
        ISubscription.Plan memory monthly = subscription.getPlan(0);
        assertEq(monthly.name, "Monthly");
        assertEq(monthly.price, MONTHLY_PRICE);
        assertEq(monthly.duration, 30 days);
        assertTrue(monthly.active);

        ISubscription.Plan memory quarterly = subscription.getPlan(1);
        assertEq(quarterly.name, "Quarterly");
        assertEq(quarterly.price, QUARTERLY_PRICE);
        assertEq(quarterly.duration, 90 days);

        ISubscription.Plan memory yearly = subscription.getPlan(2);
        assertEq(yearly.name, "Yearly");
        assertEq(yearly.price, YEARLY_PRICE);
        assertEq(yearly.duration, 365 days);
    }

    // ============================================================
    //                     SUBSCRIPTION TESTS
    // ============================================================

    function test_Subscribe_Monthly() public {
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        assertTrue(subscription.isActive(user1));

        ISubscription.Subscription memory sub = subscription.getSubscription(user1);
        assertEq(sub.planId, 0);
        assertEq(sub.startTime, block.timestamp);
        assertEq(sub.endTime, block.timestamp + 30 days);
        assertFalse(sub.autoRenew);
    }

    function test_Subscribe_WithAutoRenew() public {
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, true);

        ISubscription.Subscription memory sub = subscription.getSubscription(user1);
        assertTrue(sub.autoRenew);
    }

    function test_Subscribe_RefundsExcess() public {
        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        subscription.subscribe{value: 1 ether}(0, false);

        uint256 balanceAfter = user1.balance;
        assertEq(balanceBefore - balanceAfter, MONTHLY_PRICE);
    }

    function test_Subscribe_RevertIf_InsufficientPayment() public {
        vm.prank(user1);
        vm.expectRevert(ISubscription.InsufficientPayment.selector);
        subscription.subscribe{value: 0.005 ether}(0, false);
    }

    function test_Subscribe_RevertIf_InvalidPlan() public {
        vm.prank(user1);
        vm.expectRevert(ISubscription.InvalidPlan.selector);
        subscription.subscribe{value: MONTHLY_PRICE}(99, false);
    }

    function test_Subscribe_RevertIf_AlreadySubscribed() public {
        vm.startPrank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        vm.expectRevert(ISubscription.AlreadySubscribed.selector);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);
        vm.stopPrank();
    }

    function test_Subscribe_AllowsAfterExpiry() public {
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        // Fast forward past expiry
        vm.warp(block.timestamp + 31 days);

        assertFalse(subscription.isActive(user1));

        // Should be able to subscribe again
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        assertTrue(subscription.isActive(user1));
    }

    // ============================================================
    //                       RENEWAL TESTS
    // ============================================================

    function test_Renew() public {
        vm.startPrank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        uint256 originalEndTime = subscription.getSubscription(user1).endTime;

        subscription.renew{value: MONTHLY_PRICE}();

        uint256 newEndTime = subscription.getSubscription(user1).endTime;
        assertEq(newEndTime, originalEndTime + 30 days);
        vm.stopPrank();
    }

    function test_Renew_AfterExpiry() public {
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        // Fast forward past expiry
        vm.warp(block.timestamp + 31 days);

        vm.prank(user1);
        subscription.renew{value: MONTHLY_PRICE}();

        // Should start from now, not from old end time
        ISubscription.Subscription memory sub = subscription.getSubscription(user1);
        assertEq(sub.endTime, block.timestamp + 30 days);
    }

    function test_Renew_RevertIf_NotSubscribed() public {
        vm.prank(user1);
        vm.expectRevert(ISubscription.NotSubscribed.selector);
        subscription.renew{value: MONTHLY_PRICE}();
    }

    // ============================================================
    //                     AUTO-RENEW TESTS
    // ============================================================

    function test_CancelAutoRenew() public {
        vm.startPrank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, true);

        assertTrue(subscription.getSubscription(user1).autoRenew);

        subscription.cancelAutoRenew();

        assertFalse(subscription.getSubscription(user1).autoRenew);
        // Subscription should still be active
        assertTrue(subscription.isActive(user1));
        vm.stopPrank();
    }

    function test_SetAutoRenew() public {
        vm.startPrank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        subscription.setAutoRenew(true);
        assertTrue(subscription.getSubscription(user1).autoRenew);

        subscription.setAutoRenew(false);
        assertFalse(subscription.getSubscription(user1).autoRenew);
        vm.stopPrank();
    }

    // ============================================================
    //                       VIEW FUNCTION TESTS
    // ============================================================

    function test_TimeRemaining() public {
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        assertEq(subscription.timeRemaining(user1), 30 days);

        vm.warp(block.timestamp + 10 days);
        assertEq(subscription.timeRemaining(user1), 20 days);

        vm.warp(block.timestamp + 25 days);
        assertEq(subscription.timeRemaining(user1), 0);
    }

    function test_GetPlans() public view {
        ISubscription.Plan[] memory plans = subscription.getPlans();
        assertEq(plans.length, 3);
    }

    // ============================================================
    //                       ADMIN TESTS
    // ============================================================

    function test_CreatePlan() public {
        subscription.createPlan("Weekly", 0.003 ether, 7 days);

        assertEq(subscription.planCount(), 4);

        ISubscription.Plan memory weekly = subscription.getPlan(3);
        assertEq(weekly.name, "Weekly");
        assertEq(weekly.price, 0.003 ether);
        assertEq(weekly.duration, 7 days);
    }

    function test_UpdatePlan() public {
        subscription.updatePlan(0, 0.02 ether, true);

        ISubscription.Plan memory plan = subscription.getPlan(0);
        assertEq(plan.price, 0.02 ether);
        assertTrue(plan.active);
    }

    function test_UpdatePlan_Deactivate() public {
        subscription.updatePlan(0, 0, false);

        ISubscription.Plan memory plan = subscription.getPlan(0);
        assertEq(plan.price, MONTHLY_PRICE); // Unchanged
        assertFalse(plan.active);

        // Can't subscribe to inactive plan
        vm.prank(user1);
        vm.expectRevert(ISubscription.PlanNotActive.selector);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);
    }

    function test_Withdraw() public {
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        uint256 treasuryBalanceBefore = treasury.balance;

        subscription.withdraw();

        assertEq(treasury.balance, treasuryBalanceBefore + MONTHLY_PRICE);
        assertEq(address(subscription).balance, 0);
    }

    function test_GrantSubscription() public {
        subscription.grantSubscription(user1, 0, 0);

        assertTrue(subscription.isActive(user1));
        assertEq(subscription.getSubscription(user1).endTime, block.timestamp + 30 days);
    }

    function test_GrantSubscription_CustomDuration() public {
        subscription.grantSubscription(user1, 0, 7 days);

        assertEq(subscription.getSubscription(user1).endTime, block.timestamp + 7 days);
    }

    function test_GrantSubscription_ExtendsExisting() public {
        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        uint256 originalEndTime = subscription.getSubscription(user1).endTime;

        subscription.grantSubscription(user1, 0, 7 days);

        assertEq(subscription.getSubscription(user1).endTime, originalEndTime + 7 days);
    }

    function test_TransferOwnership() public {
        subscription.transferOwnership(user1);
        assertEq(subscription.owner(), user1);
    }

    function test_SetTreasury() public {
        subscription.setTreasury(user1);
        assertEq(subscription.treasury(), user1);
    }

    // ============================================================
    //                    AUTHORIZATION TESTS
    // ============================================================

    function test_RevertIf_NonOwner_CreatePlan() public {
        vm.prank(user1);
        vm.expectRevert(ISubscription.Unauthorized.selector);
        subscription.createPlan("Test", 0.01 ether, 1 days);
    }

    function test_RevertIf_NonOwner_UpdatePlan() public {
        vm.prank(user1);
        vm.expectRevert(ISubscription.Unauthorized.selector);
        subscription.updatePlan(0, 0.02 ether, true);
    }

    function test_RevertIf_NonOwner_Withdraw() public {
        vm.prank(user1);
        vm.expectRevert(ISubscription.Unauthorized.selector);
        subscription.withdraw();
    }

    function test_RevertIf_NonOwner_GrantSubscription() public {
        vm.prank(user1);
        vm.expectRevert(ISubscription.Unauthorized.selector);
        subscription.grantSubscription(user2, 0, 0);
    }

    // ============================================================
    //                        FUZZ TESTS
    // ============================================================

    function testFuzz_Subscribe(uint256 planId, bool autoRenew) public {
        planId = bound(planId, 0, 2);

        ISubscription.Plan memory plan = subscription.getPlan(planId);

        vm.prank(user1);
        subscription.subscribe{value: plan.price}(planId, autoRenew);

        assertTrue(subscription.isActive(user1));

        ISubscription.Subscription memory sub = subscription.getSubscription(user1);
        assertEq(sub.planId, planId);
        assertEq(sub.autoRenew, autoRenew);
    }

    function testFuzz_TimeRemaining(uint256 elapsed) public {
        elapsed = bound(elapsed, 0, 60 days);

        vm.prank(user1);
        subscription.subscribe{value: MONTHLY_PRICE}(0, false);

        vm.warp(block.timestamp + elapsed);

        uint256 remaining = subscription.timeRemaining(user1);

        if (elapsed >= 30 days) {
            assertEq(remaining, 0);
        } else {
            assertEq(remaining, 30 days - elapsed);
        }
    }
}
