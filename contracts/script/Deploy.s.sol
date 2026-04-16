// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MetaStake} from "../src/MetaStake.sol";
import {FeeDistributor} from "../src/FeeDistributor.sol";
import {Governance} from "../src/Governance.sol";
import {OperatorRegistry} from "../src/OperatorRegistry.sol";

/// @notice Deploy full MetaStake suite to Metadium testnet.
///
/// Usage:
///   forge script script/Deploy.s.sol:DeployMetaStake \
///     --rpc-url https://api.metadium.com/dev \
///     --private-key $DEPLOYER_KEY \
///     --broadcast --legacy --with-gas-price 80000000000
contract DeployMetaStake is Script {
    function run() external {
        uint256 maxLock = vm.envOr("MAX_LOCK", uint256(365 days));
        address deployer = msg.sender;

        vm.startBroadcast();

        MetaStake staking = new MetaStake(maxLock);
        FeeDistributor distributor = new FeeDistributor(address(staking));
        Governance gov = new Governance({
            staking_: address(staking),
            votingDelay_: 1 days,
            votingPeriod_: 3 days,
            proposalThreshold_: 1 ether,
            quorum_: 1 ether
        });
        OperatorRegistry operators = new OperatorRegistry(deployer); // deployer as initial treasury

        // Register initial services
        operators.registerService("zkBridge Relayer", deployer, 10 ether, 1000); // 10% slash
        operators.registerService("Dispute Resolver", deployer, 20 ether, 2000); // 20% slash
        operators.registerService("Agent Verifier", deployer, 10 ether, 500); // 5% slash

        vm.stopBroadcast();

        console.log("=== MetaStake Suite Deployed ===");
        console.log("MetaStake:        ", address(staking));
        console.log("FeeDistributor:   ", address(distributor));
        console.log("Governance:       ", address(gov));
        console.log("OperatorRegistry: ", address(operators));
    }
}
