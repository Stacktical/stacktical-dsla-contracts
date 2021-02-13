// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

/**
 * @title MessengerRegistry
 * @dev MessengerRegistry is a contract to register openly distributed Messengers
 */
contract MessengerRegistry {
    /// @dev (messengerAddress=>bool) to check if the Messenger was
    mapping(address => bool) public registeredMessengers;
    /// @dev (messengerAddress=>ownerAddress) to register the owner of a Messenger
    mapping(address => address) public messengerOwners;
    /// @dev (userAddress=>messengerAddress[]) to register the messengers of an owner
    mapping(address => address[]) public ownerMessengers;
    /// @dev (userAddress=>messengerAddress[]) to register the owner of a Messenger
    address public slaRegistry;

    /**
     * @dev event to log a new registered messenger
     *@param messenger 1. address of the registered messenger
     *@param owner 2. address of the owner
     */
    event MessengerRegistered(address indexed messenger, address indexed owner);

    /**
     * @dev sets the SLARegistry contract address and can only be called
     * once
     */
    function setSLARegistry() public {
        // Only able to trigger this function once
        require(
            address(slaRegistry) == address(0),
            "SLARegistry address has already been set"
        );

        slaRegistry = msg.sender;
    }

    /**
     * @dev function to register a new Messenger
     * @param _messengerAddress 1. address of the messenger
     * @param _ownerAddress 2. address of the owner
     */
    function registerMessenger(address _messengerAddress, address _ownerAddress)
        public
    {
        require(
            msg.sender == slaRegistry,
            "Should only be called using the SLARegistry contract"
        );
        require(
            registeredMessengers[_messengerAddress] == false,
            "messenger already registered"
        );
        registeredMessengers[_messengerAddress] = true;
        messengerOwners[_messengerAddress] = _ownerAddress;
        ownerMessengers[_ownerAddress].push(_messengerAddress);
        emit MessengerRegistered(_messengerAddress, _ownerAddress);
    }
}
