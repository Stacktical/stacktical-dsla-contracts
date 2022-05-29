// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import './SLA.sol';
import './SLORegistry.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './interfaces/IMessengerRegistry.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

/**
 * @title Details
 * @notice Details is a contract to fetch details of contracts with a single RPC endpoint
 * @dev this contract only provides interfaces to the protocol, no write functions
 */
contract Details {
    /// @notice A struct to represent staking information of token
    struct TokenStake {
        address tokenAddress;
        uint256 totalStake;
        uint256 usersPool;
        uint256 providersPool;
    }

    /// @notice A struct to represent dToken information
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
     * @param _slaAddress Address of SLA
     * @return stakersCount 1. amount of stakers
     * @return nextVerifiablePeriod 2. next verifiable period id
     * @return leverage 3. leverage
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

    /**
     * @dev external view function that returns all details of a SLA
     * @param _slaAddress Address of SLA
     * @param _sloRegistry Address of SLORegistry
     * @return slaOwner owner of sla
     * @return messengerAddress messenger address
     * @return sloValue slo value
     * @return creationBlockNumber blocknumber of sla creation
     * @return slaId id of sla
     * @return initialPeriodId starting period id
     * @return finalPeriodId ending period id
     * @return whiteListed is whitelisted
     * @return periodType period type
     * @return sloType slo type
     * @return ipfsHash ipfshash
     */
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

    /**
     * @notice external view function that returns slis and staking information for all periods
     * @param _slaAddress Address of SLA
     * @return periodSLIs array of slis for all periods
     * @return tokensStake array of tokenstake for all periods
     */
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
                totalStake: sla.usersPool(sla.allowedTokens(index)) +
                    sla.providersPool(sla.allowedTokens(index)),
                usersPool: sla.usersPool(sla.allowedTokens(index)),
                providersPool: sla.providersPool(sla.allowedTokens(index))
            });
        }
    }

    /**
     * @notice external view function that returns all dToken details of SLA
     * @param _slaAddress Address of SLA
     * @param _owner user address
     * @return dpTokens array of provider tokens
     * @return duTokens array of user tokens
     */
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
            address dpTokenAddress = address(sla.dpTokenRegistry(tokenAddress));
            dpTokens[index] = DtokenDetails({
                dTokenAddress: dpTokenAddress,
                tokenAddress: tokenAddress,
                totalSupply: ERC20(dpTokenAddress).totalSupply(),
                dTokenSymbol: ERC20(dpTokenAddress).symbol(),
                dTokenName: ERC20(dpTokenAddress).name(),
                balance: fromOwner
                    ? ERC20(dpTokenAddress).balanceOf(_owner)
                    : 0,
                allowance: fromOwner
                    ? ERC20(dpTokenAddress).allowance(_owner, _slaAddress)
                    : 0
            });
            address duTokenAddress = address(sla.duTokenRegistry(tokenAddress));
            duTokens[index] = DtokenDetails({
                dTokenAddress: duTokenAddress,
                tokenAddress: tokenAddress,
                totalSupply: ERC20(duTokenAddress).totalSupply(),
                dTokenSymbol: ERC20(duTokenAddress).symbol(),
                dTokenName: ERC20(duTokenAddress).name(),
                balance: fromOwner
                    ? ERC20(duTokenAddress).balanceOf(_owner)
                    : 0,
                allowance: fromOwner
                    ? ERC20(duTokenAddress).allowance(_owner, _slaAddress)
                    : 0
            });
        }
    }
}
