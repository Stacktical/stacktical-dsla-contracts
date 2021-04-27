// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "./SLA.sol";
import "./SLARegistry.sol";
import "./SLORegistry.sol";
import "./StakeRegistry.sol";
import "./PeriodRegistry.sol";
import "./MessengerRegistry.sol";
import "./Staking.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
     * @return breachedContract 1. breached contract
     * @return stakersCount 2. amount of stakers
     * @return nextVerifiablePeriod 3. amount of stakers
     */

    function getSLADynamicDetails(address _slaAddress)
        external
        view
        returns (
            bool breachedContract,
            uint256 stakersCount,
            uint256 nextVerifiablePeriod,
            uint64 leverage
        )
    {
        SLA sla = SLA(_slaAddress);
        breachedContract = sla.breachedContract();
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
            PeriodRegistry.PeriodType periodType,
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
            (uint256 timestamp, uint256 sli, SLA.Status status) =
                sla.periodSLIs(periodId);
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

    function _addressToString(address _address)
        internal
        pure
        returns (string memory)
    {
        bytes32 _bytes = bytes32(uint256(_address));
        bytes memory HEX = "0123456789abcdef";
        bytes memory _string = new bytes(42);
        _string[0] = "0";
        _string[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            _string[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
            _string[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
        }
        return string(_string);
    }
}
