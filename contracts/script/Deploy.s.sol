// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MetaStake} from "../src/MetaStake.sol";
import {FeeDistributor} from "../src/FeeDistributor.sol";
import {Governance} from "../src/Governance.sol";

/// @notice Deploy MetaStake + FeeDistributor + Governance to Metadium testnet.
///
/// Usage:
///   forge script script/Deploy.s.sol:DeployMetaStake \
///     --rpc-url https://api.metadium.com/dev \
///     --private-key $DEPLOYER_KEY \
///     --broadcast --legacy --with-gas-price 80000000000
contract DeployMetaStake is Script {
    function run() external {
        uint256 maxLock = vm.envOr("MAX_LOCK", uint256(365 days));

        vm.startBroadcast();

        MetaStake staking = new MetaStake(maxLock);
        FeeDistributor distributor = new FeeDistributor(address(staking));
        Governance gov = new Governance({
            staking_: address(staking),
            votingDelay_: 1 days,
            votingPeriod_: 3 days,
            proposalThreshold_: 1 ether, // 1 veMETA
            quorum_: 1 ether // 1 veMETA total votes
        });

        vm.stopBroadcast();

        console.log("MetaStake deployed at:", address(staking));
        console.log("FeeDistributor deployed at:", address(distributor));
        console.log("Governance deployed at:", address(gov));
        console.log("  MAX_LOCK:", maxLock, "seconds");
    }
}
