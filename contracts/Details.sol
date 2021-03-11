// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "./SLO.sol";
import "./SLA.sol";
import "./SLARegistry.sol";
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
    }

    /**
     * @dev external view function that returns all agreement information
     * @return slaOwner 1. address  owner
     * @return periodType 2. periodType of the sla contract
     * @return breachedContract 3. breached contract
     * @return whiteListed 3. breached contract
     * @return slo 4. addresses of the SLO
     * @return creationBlockNumber 5. addresses of the SLO
     * @return stakersCount 6. amount of stakers
     * @return nextVerifiablePeriod 7. amount of stakers
     * @return slaId 8. -
     * @return cumulatedDevaluation 9. -
     * @return cumulatedDevaluationPrecision 10. -
     * @return ipfsHash 11. string  ipfsHash
     */

    function getSLADetails(address _slaAddress)
        external
        view
        returns (
            address slaOwner,
            PeriodRegistry.PeriodType periodType,
            bool breachedContract,
            bool whiteListed,
            SLO slo,
            uint256 creationBlockNumber,
            uint256 stakersCount,
            uint256 nextVerifiablePeriod,
            uint256 slaId,
            uint256 cumulatedDevaluation,
            uint256 cumulatedDevaluationPrecision,
            string memory ipfsHash
        )
    {
        SLA sla = SLA(_slaAddress);
        slaOwner = sla.owner();
        periodType = sla.periodType();
        breachedContract = sla.breachedContract();
        whiteListed = sla.whitelistedContract();
        slo = sla.slo();
        creationBlockNumber = sla.creationBlockNumber();
        stakersCount = sla.getStakersLength();
        nextVerifiablePeriod = sla.nextVerifiablePeriod();
        slaId = sla.slaID();
        cumulatedDevaluation = sla.cumulatedDevaluation();
        cumulatedDevaluationPrecision = sla.cumulatedDevaluationPrecision();
        ipfsHash = sla.ipfsHash();
    }

    function getSLADetailsArrays(address _slaAddress)
        external
        view
        returns (
            DtokenDetails[] memory dpTokens,
            DtokenDetails[] memory duTokens,
            uint256[] memory periodIDs,
            SLA.PeriodSLI[] memory periodSLIs,
            TokenStake[] memory tokensStake
        )
    {
        SLA sla = SLA(_slaAddress);
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
        uint256 allowedTokensLength = sla.getAllowedTokensLength();
        tokensStake = new TokenStake[](allowedTokensLength);
        dpTokens = new DtokenDetails[](allowedTokensLength);
        duTokens = new DtokenDetails[](allowedTokensLength);
        for (uint256 index = 0; index < allowedTokensLength; index++) {
            address tokenAddress = sla.allowedTokens(index);
            tokensStake[index] = TokenStake({
                tokenAddress: tokenAddress,
                totalStake: sla.usersPool(sla.allowedTokens(index)) +
                    sla.providerPool(sla.allowedTokens(index)),
                usersPool: sla.usersPool(sla.allowedTokens(index)),
                providerPool: sla.providerPool(sla.allowedTokens(index))
            });
            address dpTokenAddress = address(sla.dpTokenRegistry(tokenAddress));
            dpTokens[index] = DtokenDetails({
                dTokenAddress: dpTokenAddress,
                tokenAddress: tokenAddress,
                totalSupply: ERC20(dpTokenAddress).totalSupply(),
                dTokenSymbol: ERC20(dpTokenAddress).symbol(),
                dTokenName: ERC20(dpTokenAddress).name()
            });
            address duTokenAddress = address(sla.duTokenRegistry(tokenAddress));
            duTokens[index] = DtokenDetails({
                dTokenAddress: duTokenAddress,
                tokenAddress: tokenAddress,
                totalSupply: ERC20(duTokenAddress).totalSupply(),
                dTokenSymbol: ERC20(duTokenAddress).symbol(),
                dTokenName: ERC20(duTokenAddress).name()
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
