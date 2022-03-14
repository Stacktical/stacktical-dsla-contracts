// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import './IPeriodRegistry.sol';

interface ISLA {
    enum Status {
        NotVerified,
        Respected,
        NotRespected
    }

    struct PeriodSLI {
        uint256 timestamp;
        uint256 sli;
        Status status;
    }

	function nextVerifiablePeriod() external view returns (uint);
    function periodSLIs(uint) external view returns (PeriodSLI memory);
    function isAllowedPeriod(uint) external view returns (bool);
    function periodType() external view returns (IPeriodRegistry.PeriodType);
    function messengerAddress() external view returns (address);
    function finalPeriodId() external view returns (uint128);
    function initialPeriodId() external view returns (uint128);
    function getStakersLength() external view returns (uint);
    function leverage() external view returns (uint64);
    function owner() external view returns (address);
    function whitelistedContract() external view returns (bool);
    function creationBlockNumber() external view returns (uint);
    function slaID() external view returns (uint128);
    function ipfsHash() external view returns (string memory);
    function getAllowedTokensLength() external view returns (uint);
    function allowedTokens(uint) external view returns (address);
    function usersPool(address) external view returns (uint);
    function providerPool(address) external view returns (uint);
    function dpTokenRegistry(address) external view returns (address);
    function duTokenRegistry(address) external view returns (address);
}