// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import './interfaces/IPeriodRegistry.sol';
import './SLA.sol';

contract SLAFactory {
    address private slaRegistry;

    modifier onlySLARegistry() {
        require(
            msg.sender == slaRegistry,
            'Should only be called using the SLARegistry contract'
        );
        _;
    }

    function setSLARegistry() public {
        // Only able to trigger this function once
        require(
            address(slaRegistry) == address(0),
            'SLARegistry address has already been set'
        );
        slaRegistry = msg.sender;
    }

	function createSLA(
        address _owner,
        bool _whitelisted,
        IPeriodRegistry.PeriodType _periodType,
        address _messengerAddress,
        uint128 _initialPeriodId,
        uint128 _finalPeriodId,
        uint128 _slaID,
        string calldata _ipfsHash,
        bytes32[] calldata _extraData,
        uint64 _leverage
	) external onlySLARegistry returns (address) {
        SLA sla = new SLA(
            _owner,
            _whitelisted,
            _periodType,
            _messengerAddress,
            _initialPeriodId,
            _finalPeriodId,
            _slaID,
            _ipfsHash,
            _extraData,
            _leverage
        );
        return address(sla);
	}
}