// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import './interfaces/ISLA.sol';
import './interfaces/ISLORegistry.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './interfaces/IMessengerRegistry.sol';
import './interfaces/IERC20Query.sol';

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
        ISLA sla = ISLA(_slaAddress);
        stakersCount = sla.getStakersLength();
        nextVerifiablePeriod = sla.nextVerifiablePeriod();
        leverage = sla.leverage();
    }

    function getSLAStaticDetails(address _slaAddress, ISLORegistry _sloRegistry)
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
            ISLORegistry.SLOType sloType,
            string memory ipfsHash
        )
    {
        ISLA sla = ISLA(_slaAddress);
        slaOwner = sla.owner();
        messengerAddress = sla.messengerAddress();
        whiteListed = sla.whitelistedContract();
        periodType = sla.periodType();
        sloValue = _sloRegistry.registeredSLO(_slaAddress).sloValue;
        sloType = _sloRegistry.registeredSLO(_slaAddress).sloType;
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
            ISLA.PeriodSLI[] memory periodSLIs,
            TokenStake[] memory tokensStake
        )
    {
        ISLA sla = ISLA(_slaAddress);
        uint256 initialPeriodId = sla.initialPeriodId();
        uint256 finalPeriodId = sla.finalPeriodId();
        uint256 periodIdsLength = finalPeriodId - initialPeriodId + 1;
        periodSLIs = new ISLA.PeriodSLI[](periodIdsLength);
        for (uint256 index = 0; index < periodIdsLength; index++) {
            uint256 periodId = initialPeriodId + index;
            periodSLIs[index] = sla.periodSLIs(periodId);
        }
        uint256 allowedTokensLength = sla.getAllowedTokensLength();
        tokensStake = new TokenStake[](allowedTokensLength);
        for (uint256 index = 0; index < allowedTokensLength; index++) {
            address tokenAddress = sla.allowedTokens(index);
            tokensStake[index] = TokenStake({
                tokenAddress: tokenAddress,
                totalStake: sla.usersPool(sla.allowedTokens(index)) +
                    sla.providerPool(sla.allowedTokens(index)),
                usersPool: sla.usersPool(sla.allowedTokens(index)),
                providerPool: sla.providerPool(sla.allowedTokens(index))
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
        ISLA sla = ISLA(_slaAddress);
        uint256 allowedTokensLength = sla.getAllowedTokensLength();
        dpTokens = new DtokenDetails[](allowedTokensLength);
        duTokens = new DtokenDetails[](allowedTokensLength);
        for (uint256 index = 0; index < allowedTokensLength; index++) {
            address tokenAddress = sla.allowedTokens(index);
            address dpTokenAddress = sla.dpTokenRegistry(tokenAddress);
            dpTokens[index] = DtokenDetails({
                dTokenAddress: dpTokenAddress,
                tokenAddress: tokenAddress,
                totalSupply: IERC20Query(dpTokenAddress).totalSupply(),
                dTokenSymbol: IERC20Query(dpTokenAddress).symbol(),
                dTokenName: IERC20Query(dpTokenAddress).name(),
                balance: fromOwner
                    ? IERC20Query(dpTokenAddress).balanceOf(_owner)
                    : 0,
                allowance: fromOwner
                    ? IERC20Query(dpTokenAddress).allowance(_owner, _slaAddress)
                    : 0
            });
            address duTokenAddress = address(sla.duTokenRegistry(tokenAddress));
            duTokens[index] = DtokenDetails({
                dTokenAddress: duTokenAddress,
                tokenAddress: tokenAddress,
                totalSupply: IERC20Query(duTokenAddress).totalSupply(),
                dTokenSymbol: IERC20Query(duTokenAddress).symbol(),
                dTokenName: IERC20Query(duTokenAddress).name(),
                balance: fromOwner
                    ? IERC20Query(duTokenAddress).balanceOf(_owner)
                    : 0,
                allowance: fromOwner
                    ? IERC20Query(duTokenAddress).allowance(_owner, _slaAddress)
                    : 0
            });
        }
    }
}
