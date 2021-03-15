// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import "./messenger/IMessenger.sol";

/**
 * @title MessengerRegistry
 * @dev MessengerRegistry is a contract to register openly distributed Messengers
 */
contract MessengerRegistry {
    struct Messenger {
        address messengerOwner;
        address messengerAddress;
        string messengerBaseURL;
        string messengerOwnershipURL;
        string messengerSpecificationURL;
    }

    /// @dev array to store the messengers
    Messenger[] public messengers;
    /// @dev (messengerAddress=>bool) to check if the Messenger was
    mapping(address => bool) public registeredMessengers;
    /// @dev (userAddress=>messengerAddress[]) to register the messengers of an owner
    mapping(address => uint256[]) public ownerMessengers;
    /// @dev (userAddress=>messengerAddress[]) to register the owner of a Messenger
    address public slaRegistry;

    event MessengerRegistered(
        address indexed messengerOwner,
        address indexed messengerAddress,
        string messengerBaseURL,
        string messengerOwnershipURL,
        string messengerSpecificationURL
    );

    event MessengerModified(
        address indexed messengerOwner,
        address indexed messengerAddress,
        string messengerBaseURL,
        string messengerOwnershipURL,
        string messengerSpecificationURL
    );

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
     */
    function registerMessenger(
        address _messengerAddress,
        string memory _messengerBaseURL,
        string memory _messengerOwnershipURL,
        string memory _messengerSpecificationURL
    ) public {
        require(
            msg.sender == slaRegistry,
            "Should only be called using the SLARegistry contract"
        );
        require(
            registeredMessengers[_messengerAddress] == false,
            "messenger already registered"
        );
        address messengerOwner = IMessenger(_messengerAddress).owner();
        registeredMessengers[_messengerAddress] = true;
        messengers.push(
            Messenger({
                messengerBaseURL: _messengerBaseURL,
                messengerOwnershipURL: _messengerOwnershipURL,
                messengerSpecificationURL: _messengerSpecificationURL,
                messengerOwner: messengerOwner,
                messengerAddress: _messengerAddress
            })
        );
        uint256 index = messengers.length - 1;
        ownerMessengers[messengerOwner].push(index);
        emit MessengerRegistered(
            messengerOwner,
            _messengerAddress,
            _messengerBaseURL,
            _messengerOwnershipURL,
            _messengerSpecificationURL
        );
    }

    /**
     * @dev function to modifyMessenger a new Messenger
     */
    function modifyMessenger(
        string memory _messengerBaseURL,
        string memory _messengerOwnershipURL,
        string memory _messengerSpecificationURL,
        uint256 messengerId
    ) public {
        Messenger storage messenger = messengers[messengerId];
        require(
            msg.sender == messenger.messengerOwner,
            "Can only be modified by the owner"
        );
        messenger.messengerBaseURL = _messengerBaseURL;
        messenger.messengerOwnershipURL = _messengerOwnershipURL;
        messenger.messengerSpecificationURL = _messengerSpecificationURL;
        emit MessengerModified(
            messenger.messengerOwner,
            messenger.messengerAddress,
            messenger.messengerBaseURL,
            messenger.messengerOwnershipURL,
            messenger.messengerSpecificationURL
        );
    }
}
