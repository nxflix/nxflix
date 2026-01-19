// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ISubscription
 * @notice Interface for the NXFlix subscription contract
 */
interface ISubscription {
    // ============================================================
    //                          STRUCTS
    // ============================================================

    struct Plan {
        uint256 price; // Price in wei (or token units)
        uint32 duration; // Duration in seconds
        bool active; // Whether the plan is active
        string name; // Plan name (e.g., "Monthly", "Yearly")
    }

    struct Subscription {
        uint256 planId; // The plan ID
        uint64 startTime; // When the subscription started
        uint64 endTime; // When the subscription expires
        bool autoRenew; // Whether to auto-renew
    }

    // ============================================================
    //                          EVENTS
    // ============================================================

    event PlanCreated(uint256 indexed planId, string name, uint256 price, uint32 duration);
    event PlanUpdated(uint256 indexed planId, uint256 price, bool active);
    event Subscribed(
        address indexed subscriber, uint256 indexed planId, uint64 startTime, uint64 endTime
    );
    event SubscriptionRenewed(
        address indexed subscriber, uint256 indexed planId, uint64 newEndTime
    );
    event SubscriptionCancelled(address indexed subscriber);
    event AutoRenewToggled(address indexed subscriber, bool autoRenew);
    event Withdrawn(address indexed to, uint256 amount);

    // ============================================================
    //                          ERRORS
    // ============================================================

    error InvalidPlan();
    error PlanNotActive();
    error InsufficientPayment();
    error AlreadySubscribed();
    error NotSubscribed();
    error SubscriptionNotExpired();
    error WithdrawFailed();
    error Unauthorized();

    // ============================================================
    //                     SUBSCRIPTION FUNCTIONS
    // ============================================================

    /**
     * @notice Subscribe to a plan
     * @param planId The plan ID to subscribe to
     * @param autoRenew Whether to enable auto-renewal
     */
    function subscribe(uint256 planId, bool autoRenew) external payable;

    /**
     * @notice Renew an existing subscription
     */
    function renew() external payable;

    /**
     * @notice Cancel auto-renewal (subscription remains active until expiry)
     */
    function cancelAutoRenew() external;

    /**
     * @notice Toggle auto-renewal setting
     * @param autoRenew New auto-renewal setting
     */
    function setAutoRenew(bool autoRenew) external;

    // ============================================================
    //                       VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Check if an address has an active subscription
     * @param subscriber The address to check
     * @return True if the subscription is active
     */
    function isActive(address subscriber) external view returns (bool);

    /**
     * @notice Get subscription details for an address
     * @param subscriber The address to query
     * @return The subscription details
     */
    function getSubscription(address subscriber) external view returns (Subscription memory);

    /**
     * @notice Get plan details
     * @param planId The plan ID to query
     * @return The plan details
     */
    function getPlan(uint256 planId) external view returns (Plan memory);

    /**
     * @notice Get all available plans
     * @return Array of all plans
     */
    function getPlans() external view returns (Plan[] memory);

    /**
     * @notice Get time remaining on a subscription
     * @param subscriber The address to check
     * @return Seconds remaining (0 if expired)
     */
    function timeRemaining(address subscriber) external view returns (uint256);
}
