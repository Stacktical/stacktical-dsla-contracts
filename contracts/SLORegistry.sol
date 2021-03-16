// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "./SLO.sol";

/**
 * @title SLORegistry
 * @dev SLORegistry is a contract for handling creation of service level
 * objectives and querying those service level objectives
 */
contract SLORegistry {
    /// @dev checking types to check if a SLA was honored or not
    enum SLOType {
        EqualTo,
        NotEqualTo,
        SmallerThan,
        SmallerOrEqualTo,
        GreaterThan,
        GreaterOrEqualTo
    }

    /// @dev array of deployed SLOs
    address[] public SLOs;

    /// @dev (sloValue=>SLOType=>SLOAddress)
    mapping(uint256 => mapping(SLOType => address)) public sloAddresses;

    /// @dev (sloAddress=>bool)
    mapping(address => bool) public registeredSLOs;

    /**
     * @dev event for service level objective creation logging
     * @param slo 1.  the address of the created service level objective contract
     * @param value 2.  the value of the SLO
     * @param sloType 3.  the type of the SLO
     */
    event SLOCreated(SLO indexed slo, uint256 value, SLOType sloType);

    /**
     * @dev public function for creating service level objectives
     * @param _value 1. the value to check against
     * @param _sloType 2. type of check
     */
    function createSLO(uint256 _value, SLOType _sloType) public {
        require(
            sloAddresses[_value][_sloType] == address(0),
            "SLO already deployed"
        );
        SLO slo = new SLO(_value, _sloType);
        SLOs.push(address(slo));
        sloAddresses[_value][_sloType] = address(slo);
        registeredSLOs[address(slo)] = true;
        emit SLOCreated(slo, _value, _sloType);
    }

    /**
     * @dev function to get all the SLOs addresses
     */
    function getAllSLOs() public view returns (address[] memory) {
        return SLOs;
    }
}
