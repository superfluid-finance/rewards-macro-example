// SPDX-License-Identifier: AGPLv3
pragma solidity 0.8.20;

import { ISuperfluid, BatchOperation, IConstantFlowAgreementV1, ISuperToken }
    from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { IUserDefinedMacro } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/utils/IUserDefinedMacro.sol";
import { IGeneralDistributionAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/IGeneralDistributionAgreementV1.sol";
import { ISuperfluidPool } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/gdav1/ISuperfluidPool.sol";

// Sends rewards to a list of receivers by updating the units of the receivers in the pool
contract RewardsMacro is IUserDefinedMacro {
    function buildBatchOperations(ISuperfluid host, bytes memory params, address msgSender) public virtual view
        returns (ISuperfluid.Operation[] memory operations)
    {
        IGeneralDistributionAgreementV1 gda = IGeneralDistributionAgreementV1(address(host.getAgreementClass(
            keccak256("org.superfluid-finance.agreements.GeneralDistributionAgreement.v1")
        )));

        // parse params
        (ISuperfluidPool pool, address[] memory receivers, uint128[] memory units, int96 flowRate) =
            abi.decode(params, (ISuperfluidPool, address[], uint128[], int96));

        // construct batch operations
        operations = new ISuperfluid.Operation[](receivers.length+1);
        for (uint i = 0; i < receivers.length; ++i) {
            bytes memory callData = abi.encodeCall(gda.updateMemberUnits,
                                                   (pool,
                                                    receivers[i],
                                                    units[i],
                                                    new bytes(0) // ctx
                                                   ));
            operations[i] = ISuperfluid.Operation({
                operationType : BatchOperation.OPERATION_TYPE_SUPERFLUID_CALL_AGREEMENT, // type
                target: address(gda),
                data: abi.encode(callData, new bytes(0))
            });
        }
        bytes memory distributeFlowCallData = abi.encodeCall(gda.distributeFlow,
                                                   (pool.superToken(),
                                                    msgSender,
                                                    pool,
                                                    flowRate,
                                                    new bytes(0) // ctx
                                                   ));
        operations[receivers.length] = ISuperfluid.Operation({
            operationType: BatchOperation.OPERATION_TYPE_SUPERFLUID_CALL_AGREEMENT,
            target: address(gda),
            data: abi.encode(distributeFlowCallData, new bytes(0))
        });
    }

    // returns the abi encoded params for the macro, to be used with buildBatchOperations
    function getParams(ISuperfluidPool pool, address[] memory receivers, uint128[] memory units, int96 flowRate) external pure returns (bytes memory) {
        return abi.encode(pool, receivers, units, flowRate);
    }

    function postCheck(ISuperfluid host, bytes memory params, address msgSender) external view{
        
    }
}