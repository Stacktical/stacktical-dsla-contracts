// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

interface ISLORegistry {
    enum SLOType {
        EqualTo,
        NotEqualTo,
        SmallerThan,
        SmallerOrEqualTo,
        GreaterThan,
        GreaterOrEqualTo
    }

    function isRespected(uint, address) external view returns (bool);
    function getDeviation(uint, address, uint) external view returns (uint);

    function setSLARegistry() external;
    function registerSLO(uint, SLOType, address) external;
}