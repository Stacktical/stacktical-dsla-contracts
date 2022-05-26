// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import './SLA.sol';
import './SLORegistry.sol';
import './Staking.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './interfaces/IMessengerRegistry.sol';
import './dToken.sol';

/**
 * @title Details
 * @dev Details is a contract to fetch details of contracts with a single RPC endpoint
 */
contract Details {
    struct TokenStake {
        address tokenAddress;
        uint256 totalStake;
        uint256 usersPool;
        uint256 providersPool;
    }

    struct DtokenDetails {
        address tokenAddress;
        uint256 totalSupply;
        address dTokenAddress;
        string dTokenSymbol;
        string dTokenName;
        uint256 balance;
        uint256 allowance;
    }

    /**
     * @dev external view function that returns all dynamic agreement information
     * @return stakersCount 2. amount of stakers
     * @return nextVerifiablePeriod 3. amount of stakers
     */

    function getSLADynamicDetails(address _slaAddress)
        external
        view
        returns (
            uint256 stakersCount,
            uint256 nextVerifiablePeriod,
            uint64 leverage
        )
    {
        SLA sla = SLA(_slaAddress);
        stakersCount = sla.getStakersLength();
        nextVerifiablePeriod = sla.nextVerifiablePeriod();
        leverage = sla.leverage();
    }

    function getSLAStaticDetails(address _slaAddress, SLORegistry _sloRegistry)
        external
        view
        returns (
            address slaOwner,
            address messengerAddress,
            uint256 sloValue,
            uint256 creationBlockNumber,
            uint256 slaId,
            uint128 initialPeriodId,
            uint128 finalPeriodId,
            bool whiteListed,
            IPeriodRegistry.PeriodType periodType,
            SLORegistry.SLOType sloType,
            string memory ipfsHash
        )
    {
        SLA sla = SLA(_slaAddress);
        slaOwner = sla.owner();
        messengerAddress = sla.messengerAddress();
        whiteListed = sla.whitelistedContract();
        periodType = sla.periodType();
        (sloValue, sloType) = _sloRegistry.registeredSLO(_slaAddress);
        creationBlockNumber = sla.creationBlockNumber();
        slaId = sla.slaID();
        ipfsHash = sla.ipfsHash();
        initialPeriodId = sla.initialPeriodId();
        finalPeriodId = sla.finalPeriodId();
    }

    function getSLADetailsArrays(address _slaAddress)
        external
        view
        returns (
            SLA.PeriodSLI[] memory periodSLIs,
            TokenStake[] memory tokensStake
        )
    {
        SLA sla = SLA(_slaAddress);
        uint256 initialPeriodId = sla.initialPeriodId();
        uint256 finalPeriodId = sla.finalPeriodId();
        uint256 periodIdsLength = finalPeriodId - initialPeriodId + 1;
        periodSLIs = new SLA.PeriodSLI[](periodIdsLength);
        for (uint256 index = 0; index < periodIdsLength; index++) {
            uint256 periodId = initialPeriodId + index;
            (uint256 timestamp, uint256 sli, SLA.Status status) = sla
                .periodSLIs(periodId);
            periodSLIs[index] = SLA.PeriodSLI({
                status: status,
                sli: sli,
                timestamp: timestamp
            });
        }
        uint256 allowedTokensLength = sla.getAllowedTokensLength();
        tokensStake = new TokenStake[](allowedTokensLength);
        for (uint256 index = 0; index < allowedTokensLength; index++) {
            address tokenAddress = sla.allowedTokens(index);
            tokensStake[index] = TokenStake({
                tokenAddress: tokenAddress,
                totalStake: sla.usersPool(tokenAddress) +
                    sla.providersPool(tokenAddress),
                usersPool: sla.usersPool(tokenAddress),
                providersPool: sla.providersPool(tokenAddress)
            });
        }
    }

    function getDTokensDetails(address _slaAddress, address _owner)
        public
        view
        returns (
            DtokenDetails[] memory dpTokens,
            DtokenDetails[] memory duTokens
        )
    {
        bool fromOwner = _owner != address(0x0);
        SLA sla = SLA(_slaAddress);
        uint256 allowedTokensLength = sla.getAllowedTokensLength();
        dpTokens = new DtokenDetails[](allowedTokensLength);
        duTokens = new DtokenDetails[](allowedTokensLength);
        for (uint256 index = 0; index < allowedTokensLength; index++) {
            address tokenAddress = sla.allowedTokens(index);
            dToken dpToken = dToken(sla.dpTokenRegistry(tokenAddress));
            dpTokens[index] = DtokenDetails({
                dTokenAddress: address(dpToken),
                tokenAddress: tokenAddress,
                totalSupply: dpToken.totalSupply(),
                dTokenSymbol: dpToken.symbol(),
                dTokenName: dpToken.name(),
                balance: fromOwner ? dpToken.balanceOf(_owner) : 0,
                allowance: fromOwner
                    ? dpToken.allowance(_owner, _slaAddress)
                    : 0
            });
            dToken duToken = dToken(sla.duTokenRegistry(tokenAddress));
            duTokens[index] = DtokenDetails({
                dTokenAddress: address(duToken),
                tokenAddress: tokenAddress,
                totalSupply: duToken.totalSupply(),
                dTokenSymbol: duToken.symbol(),
                dTokenName: duToken.name(),
                balance: fromOwner ? duToken.balanceOf(_owner) : 0,
                allowance: fromOwner
                    ? duToken.allowance(_owner, _slaAddress)
                    : 0
            });
        }
    }
}
