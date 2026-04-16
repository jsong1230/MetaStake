// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MetaStake} from "../src/MetaStake.sol";
import {FeeDistributor} from "../src/FeeDistributor.sol";

/// @notice Deploy MetaStake + FeeDistributor to Metadium testnet (chainId 12).
///
/// Usage:
///   forge script script/Deploy.s.sol:DeployMetaStake \
///     --rpc-url https://api.metadium.com/dev \
///     --private-key $DEPLOYER_KEY \
///     --broadcast --legacy --with-gas-price 80000000000
///
/// Environment variables:
///   MAX_LOCK — (optional) max lock duration in seconds, defaults to 365 days
contract DeployMetaStake is Script {
    function run() external {
        uint256 maxLock = vm.envOr("MAX_LOCK", uint256(365 days));

        vm.startBroadcast();

        MetaStake staking = new MetaStake(maxLock);
        FeeDistributor distributor = new FeeDistributor(address(staking));

        vm.stopBroadcast();

        console.log("MetaStake deployed at:", address(staking));
        console.log("FeeDistributor deployed at:", address(distributor));
        console.log("  MAX_LOCK:", maxLock, "seconds");
    }
}
