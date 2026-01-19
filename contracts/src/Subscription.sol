// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ISubscription} from "./interfaces/ISubscription.sol";

/**
 * @title Subscription
 * @author NXFlix
 * @notice Time-based subscription contract for JLPT study platform
 * @dev Supports multiple subscription plans with auto-renewal capability
 */
contract Subscription is ISubscription {
    // ============================================================
    //                          STORAGE
    // ============================================================

    /// @notice Contract owner
    address public owner;

    /// @notice Treasury address for withdrawals
    address public treasury;

    /// @notice Array of subscription plans
    Plan[] public plans;

    /// @notice Mapping of subscriber address to their subscription
    mapping(address => Subscription) public subscriptions;

    /// @notice Total revenue collected
    uint256 public totalRevenue;

    // ============================================================
    //                         MODIFIERS
    // ============================================================

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    // ============================================================
    //                        CONSTRUCTOR
    // ============================================================

    /**
     * @notice Initialize the subscription contract
     * @param _treasury Address to receive subscription payments
     */
    constructor(address _treasury) {
        owner = msg.sender;
        treasury = _treasury;

        // Create default plans
        _createPlan("Monthly", 0.01 ether, 30 days);
        _createPlan("Quarterly", 0.025 ether, 90 days);
        _createPlan("Yearly", 0.08 ether, 365 days);
    }

    // ============================================================
    //                     SUBSCRIPTION FUNCTIONS
    // ============================================================

    /// @inheritdoc ISubscription
    function subscribe(uint256 planId, bool autoRenew) external payable {
        if (planId >= plans.length) revert InvalidPlan();

        Plan storage plan = plans[planId];
        if (!plan.active) revert PlanNotActive();
        if (msg.value < plan.price) revert InsufficientPayment();

        Subscription storage sub = subscriptions[msg.sender];

        // Check if already has active subscription
        if (sub.endTime > block.timestamp) revert AlreadySubscribed();

        // Create new subscription
        uint64 startTime = uint64(block.timestamp);
        uint64 endTime = startTime + plan.duration;

        subscriptions[msg.sender] = Subscription({
            planId: planId,
            startTime: startTime,
            endTime: endTime,
            autoRenew: autoRenew
        });

        totalRevenue += msg.value;

        emit Subscribed(msg.sender, planId, startTime, endTime);

        // Refund excess payment
        if (msg.value > plan.price) {
            _safeTransfer(msg.sender, msg.value - plan.price);
        }
    }

    /// @inheritdoc ISubscription
    function renew() external payable {
        Subscription storage sub = subscriptions[msg.sender];
        if (sub.endTime == 0) revert NotSubscribed();

        Plan storage plan = plans[sub.planId];
        if (!plan.active) revert PlanNotActive();
        if (msg.value < plan.price) revert InsufficientPayment();

        // Extend from current end time or now, whichever is later
        uint64 baseTime = sub.endTime > block.timestamp ? sub.endTime : uint64(block.timestamp);
        uint64 newEndTime = baseTime + plan.duration;

        sub.endTime = newEndTime;
        totalRevenue += msg.value;

        emit SubscriptionRenewed(msg.sender, sub.planId, newEndTime);

        // Refund excess payment
        if (msg.value > plan.price) {
            _safeTransfer(msg.sender, msg.value - plan.price);
        }
    }

    /// @inheritdoc ISubscription
    function cancelAutoRenew() external {
        Subscription storage sub = subscriptions[msg.sender];
        if (sub.endTime == 0) revert NotSubscribed();

        sub.autoRenew = false;
        emit SubscriptionCancelled(msg.sender);
    }

    /// @inheritdoc ISubscription
    function setAutoRenew(bool autoRenew) external {
        Subscription storage sub = subscriptions[msg.sender];
        if (sub.endTime == 0) revert NotSubscribed();

        sub.autoRenew = autoRenew;
        emit AutoRenewToggled(msg.sender, autoRenew);
    }

    // ============================================================
    //                       VIEW FUNCTIONS
    // ============================================================

    /// @inheritdoc ISubscription
    function isActive(address subscriber) external view returns (bool) {
        return subscriptions[subscriber].endTime > block.timestamp;
    }

    /// @inheritdoc ISubscription
    function getSubscription(address subscriber) external view returns (Subscription memory) {
        return subscriptions[subscriber];
    }

    /// @inheritdoc ISubscription
    function getPlan(uint256 planId) external view returns (Plan memory) {
        if (planId >= plans.length) revert InvalidPlan();
        return plans[planId];
    }

    /// @inheritdoc ISubscription
    function getPlans() external view returns (Plan[] memory) {
        return plans;
    }

    /// @inheritdoc ISubscription
    function timeRemaining(address subscriber) external view returns (uint256) {
        Subscription storage sub = subscriptions[subscriber];
        if (sub.endTime <= block.timestamp) return 0;
        return sub.endTime - block.timestamp;
    }

    /// @notice Get the total number of plans
    function planCount() external view returns (uint256) {
        return plans.length;
    }

    // ============================================================
    //                       ADMIN FUNCTIONS
    // ============================================================

    /**
     * @notice Create a new subscription plan
     * @param name Plan name
     * @param price Plan price in wei
     * @param duration Plan duration in seconds
     */
    function createPlan(string calldata name, uint256 price, uint32 duration) external onlyOwner {
        _createPlan(name, price, duration);
    }

    /**
     * @notice Update an existing plan
     * @param planId Plan ID to update
     * @param price New price (0 to keep current)
     * @param active Whether the plan should be active
     */
    function updatePlan(uint256 planId, uint256 price, bool active) external onlyOwner {
        if (planId >= plans.length) revert InvalidPlan();

        Plan storage plan = plans[planId];
        if (price > 0) {
            plan.price = price;
        }
        plan.active = active;

        emit PlanUpdated(planId, plan.price, active);
    }

    /**
     * @notice Withdraw collected funds to treasury
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        _safeTransfer(treasury, balance);
        emit Withdrawn(treasury, balance);
    }

    /**
     * @notice Update treasury address
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }

    /**
     * @notice Transfer ownership
     * @param newOwner New owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }

    /**
     * @notice Grant subscription to an address (for promotions/giveaways)
     * @param subscriber Address to grant subscription to
     * @param planId Plan to grant
     * @param duration Custom duration (0 to use plan duration)
     */
    function grantSubscription(
        address subscriber,
        uint256 planId,
        uint32 duration
    ) external onlyOwner {
        if (planId >= plans.length) revert InvalidPlan();

        Plan storage plan = plans[planId];
        uint32 grantDuration = duration > 0 ? duration : plan.duration;

        uint64 startTime = uint64(block.timestamp);
        uint64 endTime = startTime + grantDuration;

        // If already subscribed, extend from current end time
        Subscription storage sub = subscriptions[subscriber];
        if (sub.endTime > block.timestamp) {
            endTime = sub.endTime + grantDuration;
        }

        subscriptions[subscriber] = Subscription({
            planId: planId,
            startTime: startTime,
            endTime: endTime,
            autoRenew: false
        });

        emit Subscribed(subscriber, planId, startTime, endTime);
    }

    // ============================================================
    //                      INTERNAL FUNCTIONS
    // ============================================================

    function _createPlan(string memory name, uint256 price, uint32 duration) internal {
        uint256 planId = plans.length;
        plans.push(Plan({price: price, duration: duration, active: true, name: name}));

        emit PlanCreated(planId, name, price, duration);
    }

    function _safeTransfer(address to, uint256 amount) internal {
        (bool success,) = to.call{value: amount}("");
        if (!success) revert WithdrawFailed();
    }

    // ============================================================
    //                          RECEIVE
    // ============================================================

    /// @notice Allow contract to receive ETH
    receive() external payable {}
}
