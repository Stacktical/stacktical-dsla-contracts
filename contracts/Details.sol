// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./SLO.sol";
import "./SLA.sol";
import "./SLARegistry.sol";
import "./StakeRegistry.sol";
import "./PeriodRegistry.sol";
import "./MessengerRegistry.sol";
import "./Staking.sol";

/**
 * @title Details
 * @dev Details is a contract to fetch details of contracts with a single RPC endpoint
 */
contract Details {
    struct TokenStake {
        address tokenAddress;
        uint256 totalStake;
        uint256 usersPool;
        uint256 providerPool;
    }

    /**
     * @dev external view function that returns all agreement information
     * @return slaOwner 1. address  owner
     * @return ipfsHash 2. string  ipfsHash
     * @return slo 3. addresses of the SLO
     * @return periodSLIs 5. PeriodSLI[]
     * @return periodIDs 6. array of period IDs
     * @return periodType 7. periodType of the sla contract
     * @return stakersCount 8. amount of stakers
     * @return tokensStake 9. TokenStake[]
     */

    function getSLADetails(address _slaAddress)
        external
        view
        returns (
            address slaOwner,
            string memory ipfsHash,
            SLO slo,
            SLA.PeriodSLI[] memory periodSLIs,
            uint256[] memory periodIDs,
            PeriodRegistry.PeriodType periodType,
            uint256 stakersCount,
            TokenStake[] memory tokensStake,
            uint256 nextVerifiablePeriod
        )
    {
        SLA sla = SLA(_slaAddress);
        slaOwner = sla.owner();
        ipfsHash = sla.ipfsHash();
        slo = sla.slo();
        periodType = sla.periodType();
        uint256 periodIdsLength = sla.getPeriodIdsLength();
        periodSLIs = new SLA.PeriodSLI[](periodIdsLength);
        periodIDs = new uint256[](periodIdsLength);
        for (uint256 index = 0; index < periodIdsLength; index++) {
            uint256 periodId = sla.periodIds(index);
            (uint256 timestamp, uint256 sli, SLA.Status status) =
                sla.periodSLIs(periodId);
            periodSLIs[index] = SLA.PeriodSLI({
                status: status,
                sli: sli,
                timestamp: timestamp
            });
            periodIDs[index] = sla.periodIds(index);
        }
        stakersCount = sla.getStakersLength();
        uint256 allowedTokensLength = sla.getAllowedTokensLength();
        tokensStake = new TokenStake[](allowedTokensLength);
        for (uint256 index = 0; index < allowedTokensLength; index++) {
            tokensStake[index] = TokenStake({
                tokenAddress: sla.allowedTokens(index),
                totalStake: sla.usersPool(sla.allowedTokens(index)) +
                    sla.providerPool(sla.allowedTokens(index)),
                usersPool: sla.usersPool(sla.allowedTokens(index)),
                providerPool: sla.providerPool(sla.allowedTokens(index))
            });
        }
        nextVerifiablePeriod = sla.nextVerifiablePeriod();
    }
}
