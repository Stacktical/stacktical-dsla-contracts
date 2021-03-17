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
        address ownerAddress;
        address messengerAddress;
        string specificationUrl;
        uint256 precision;
        uint256 requestsCounter;
        uint256 fulfillsCounter;
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
        address indexed ownerAddress,
        address indexed messengerAddress,
        string specificationUrl,
        uint256 precision
    );

    event MessengerModified(
        address indexed ownerAddress,
        address indexed messengerAddress,
        string specificationUrl,
        uint256 precision
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
        address _callerAddress,
        address _messengerAddress,
        string memory _specificationUrl
    ) public {
        require(
            msg.sender == slaRegistry,
            "Should only be called using the SLARegistry contract"
        );
        require(
            registeredMessengers[_messengerAddress] == false,
            "messenger already registered"
        );

        IMessenger messenger = IMessenger(_messengerAddress);
        address messengerOwner = messenger.owner();
        require(
            messengerOwner == _callerAddress,
            "Should only be called by the messenger owner"
        );
        uint256 precision = messenger.messengerPrecision();
        uint256 requestsCounter = messenger.requestsCounter();
        uint256 fulfillsCounter = messenger.fulfillsCounter();
        messengers.push(
            Messenger({
                ownerAddress: messengerOwner,
                messengerAddress: _messengerAddress,
                specificationUrl: _specificationUrl,
                precision: precision,
                requestsCounter: requestsCounter,
                fulfillsCounter: fulfillsCounter
            })
        );

        registeredMessengers[_messengerAddress] = true;
        uint256 index = messengers.length - 1;
        ownerMessengers[messengerOwner].push(index);

        emit MessengerRegistered(
            messengerOwner,
            _messengerAddress,
            _specificationUrl,
            precision
        );
    }

    /**
     * @dev function to modifyMessenger a Messenger
     */
    function modifyMessenger(
        string memory _specificationUrl,
        uint256 _messengerId
    ) public {
        Messenger storage storedMessenger = messengers[_messengerId];
        IMessenger messenger = IMessenger(storedMessenger.messengerAddress);
        require(
            msg.sender == messenger.owner(),
            "Can only be modified by the owner"
        );
        storedMessenger.specificationUrl = _specificationUrl;
        storedMessenger.ownerAddress = msg.sender;
        emit MessengerModified(
            storedMessenger.ownerAddress,
            storedMessenger.messengerAddress,
            storedMessenger.specificationUrl,
            storedMessenger.precision
        );
    }

    function getMessengers() public view returns (Messenger[] memory) {
        Messenger[] memory returnMessengers =
            new Messenger[](messengers.length);
        for (uint256 index = 0; index < messengers.length; index++) {
            IMessenger messenger =
                IMessenger(messengers[index].messengerAddress);
            uint256 requestsCounter = messenger.requestsCounter();
            uint256 fulfillsCounter = messenger.fulfillsCounter();
            returnMessengers[index] = Messenger({
                ownerAddress: messengers[index].ownerAddress,
                messengerAddress: messengers[index].messengerAddress,
                specificationUrl: messengers[index].specificationUrl,
                precision: messengers[index].precision,
                requestsCounter: requestsCounter,
                fulfillsCounter: fulfillsCounter
            });
        }
        return returnMessengers;
    }

    function getMessengersLength() public view returns (uint256) {
        return messengers.length;
    }
}
