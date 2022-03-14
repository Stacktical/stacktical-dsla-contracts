// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

interface ISLORegistry {
    enum SLOType {
        EqualTo,
        NotEqualTo,
        SmallerThan,
        SmallerOrEqualTo,
        GreaterThan,
        GreaterOrEqualTo
    }

    struct SLO {
        uint256 sloValue;
        SLOType sloType;
    }

    function isRespected(uint, address) external view returns (bool);
    function getDeviation(uint, address, uint) external view returns (uint);
    function registeredSLO(address) external view returns (SLO memory);

    function setSLARegistry() external;
    function registerSLO(uint, SLOType, address) external;
}