// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

interface IMessengerRegistry {
    function setSLARegistry() external;

    function registerMessenger(
        address callerAddress_,
        address messengerAddress_,
        string calldata specificationUrl_
    ) external;

    function registeredMessengers(address messengerAddress_)
        external
        view
        returns (bool);
}
