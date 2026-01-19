// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {Subscription} from "../src/Subscription.sol";

/**
 * @title DeploySubscription
 * @notice Deployment script for the Subscription contract
 * @dev Usage:
 *   Base Mainnet:  forge script script/DeploySubscription.s.sol --rpc-url base --broadcast --verify
 *   Base Sepolia:  forge script script/DeploySubscription.s.sol --rpc-url base_sepolia --broadcast --verify
 *   ETH Mainnet:   forge script script/DeploySubscription.s.sol --rpc-url mainnet --broadcast --verify
 *   Sepolia:       forge script script/DeploySubscription.s.sol --rpc-url sepolia --broadcast --verify
 */
contract DeploySubscription is Script {
    function run() external returns (Subscription) {
        // Get treasury address from environment or use deployer
        address treasury = vm.envOr("TREASURY_ADDRESS", msg.sender);

        console.log("Deploying Subscription contract...");
        console.log("Treasury:", treasury);

        vm.startBroadcast();

        Subscription subscription = new Subscription(treasury);

        vm.stopBroadcast();

        console.log("Subscription deployed at:", address(subscription));
        console.log("Owner:", subscription.owner());

        return subscription;
    }
}
