// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

interface ISLARegistry {
    function sloRegistry() external view returns (address);

    function periodRegistry() external view returns (address);

    function messengerRegistry() external view returns (address);

    function stakeRegistry() external view returns (address);

    function isRegisteredSLA(address _slaAddress) external view returns (bool);
}
