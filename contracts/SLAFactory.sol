// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import '@openzeppelin/contracts/access/Ownable.sol';
import './interfaces/ISLAFactory.sol';
import './interfaces/IPeriodRegistry.sol';
import './SLA.sol';

contract SLAFactory is ISLAFactory, Ownable {
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
	) external override onlyOwner returns (address) {
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