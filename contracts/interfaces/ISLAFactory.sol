// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import './IPeriodRegistry.sol';

interface ISLAFactory {
	function createSLA(
		address, bool, IPeriodRegistry.PeriodType,
		address, uint128, uint128, uint128,
		string calldata, bytes32[] calldata, uint64
	) external returns (address);

	function setSLARegistry() external;
}