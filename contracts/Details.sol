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
     * @return _slaOwner 1. address  owner
     * @return _ipfsHash 2. string  ipfsHash
     * @return _SLO 3. addresses of the SLO
     * @return _SLAPeriods 5. SLAPeriod[]
     * @return _stakersCount 6. amount of stakers
     * @return _tokensStake 7. SLAPeriod[]  addresses array
     */

    function getSLADetails(address _slaAddress)
        external
        view
        returns (
            address _slaOwner,
            string memory _ipfsHash,
            SLO _SLO,
            SLA.SLAPeriod[] memory _SLAPeriods,
            uint256 _stakersCount,
            TokenStake[] memory _tokensStake
        )
    {
        SLA sla = SLA(_slaAddress);
        _slaOwner = sla.owner();
        _ipfsHash = sla.ipfsHash();
        _SLO = sla.slo();
        uint256 periodIdsLength = sla.getPeriodIdsLength();
        _SLAPeriods = new SLA.SLAPeriod[](periodIdsLength);
        for (uint256 index = 0; index < periodIdsLength; index++) {
            uint256 periodId = sla.periodIds(index);
            (uint256 timestamp, uint256 sli, SLA.Status status) =
                sla.slaPeriods(periodId);
            _SLAPeriods[index] = SLA.SLAPeriod({
                status: status,
                sli: sli,
                timestamp: timestamp
            });
        }
        _stakersCount = sla.getStakersLength();
        uint256 allowedTokensLength = sla.getAllowedTokensLength();
        _tokensStake = new TokenStake[](allowedTokensLength);
        for (uint256 index = 0; index < allowedTokensLength; index++) {
            _tokensStake[index] = TokenStake({
                tokenAddress: sla.allowedTokens(index),
                totalStake: sla.usersPool(sla.allowedTokens(index)) +
                    sla.providerPool(sla.allowedTokens(index)),
                usersPool: sla.usersPool(sla.allowedTokens(index)),
                providerPool: sla.providerPool(sla.allowedTokens(index))
            });
        }
    }
}
