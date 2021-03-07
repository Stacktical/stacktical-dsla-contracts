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
     * @return periodType 2. periodType of the sla contract
     * @return breachedContract 3. breached contract
     * @return slo 4. addresses of the SLO
     * @return creationBlockNumber 5. addresses of the SLO
     * @return stakersCount 6. amount of stakers
     * @return nextVerifiablePeriod 7. amount of stakers
     * @return ipfsHash 8. string  ipfsHash
     * @return periodIDs 9. array of period IDs
     * @return periodSLIs 10. PeriodSLI[]
     * @return tokensStake 11. TokenStake[]
     */

    function getSLADetails(address _slaAddress)
        external
        view
        returns (
            address slaOwner,
            PeriodRegistry.PeriodType periodType,
            bool breachedContract,
            SLO slo,
            uint256 creationBlockNumber,
            uint256 stakersCount,
            uint256 nextVerifiablePeriod,
            string memory ipfsHash,
            uint256[] memory periodIDs,
            SLA.PeriodSLI[] memory periodSLIs,
            TokenStake[] memory tokensStake
        )
    {
        SLA sla = SLA(_slaAddress);
        breachedContract = sla.breachedContract();
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
        creationBlockNumber = sla.creationBlockNumber();
    }
}
