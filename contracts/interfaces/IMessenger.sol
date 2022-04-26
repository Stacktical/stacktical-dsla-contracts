pragma solidity 0.6.6;

import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title IMessenger
 * @dev Interface to create new Messenger contract to add lo Messenger lists
 */

abstract contract IMessenger is Ownable {
    struct SLIRequest {
        address slaAddress;
        uint256 periodId;
    }

    /**
     * @dev event emitted when having a response from Chainlink with the SLI
     * @param slaAddress 1. SLA address to store the SLI
     * @param periodId 2. id of the Chainlink request
     * @param requestId 3. id of the Chainlink request
     * @param chainlinkResponse 4. response from Chainlink
     */
    event SLIReceived(
        address indexed slaAddress,
        uint256 periodId,
        bytes32 indexed requestId,
        bytes32 chainlinkResponse
    );

    /**
     * @dev sets the SLARegistry contract address and can only be called once
     */
    function setSLARegistry() external virtual;

    /**
     * @dev creates a ChainLink request to get a new SLI value for the
     * given params. Can only be called by the SLARegistry contract or Chainlink Oracle.
     * @param _periodId 1. id of the period to be queried
     * @param _slaAddress 2. address of the receiver SLA
     * @param _slaAddress 2. if approval by owner or msg.sender
     */

    function requestSLI(
        uint256 _periodId,
        address _slaAddress,
        bool _ownerApproval,
        address _callerAddress
    ) external virtual;

    /**
     * @dev callback function for the Chainlink SLI request which stores
     * the SLI in the SLA contract
     * @param _requestId the ID of the ChainLink request
     * @param _chainlinkResponseUint256 response object from Chainlink Oracles
     */
    function fulfillSLI(bytes32 _requestId, uint256 _chainlinkResponseUint256)
        external
        virtual;

    /**
     * @dev gets the interfaces precision
     */
    function messengerPrecision() external view virtual returns (uint256);

    /**
     * @dev gets the slaRegistryAddress
     */
    function slaRegistryAddress() external view virtual returns (address);

    /**
     * @dev gets the chainlink oracle contract address
     */
    function oracle() external view virtual returns (address);

    /**
     * @dev gets the chainlink job id
     */
    function jobId() external view virtual returns (bytes32);

    /**
     * @dev gets the fee amount of LINK token
     */
    function fee() external view virtual returns (uint256);

    /**
     * @dev returns the requestsCounter
     */
    function requestsCounter() external view virtual returns (uint256);

    /**
     * @dev returns the fulfillsCounter
     */
    function fulfillsCounter() external view virtual returns (uint256);

    /**
     * @dev returns the name of DSLA-LP token
     */
    function lpName() external view virtual returns (string memory);

    /**
     * @dev returns the symbol of DSLA-LP token
     */
    function lpSymbol() external view virtual returns (string memory);

    /**
     * @dev returns the symbol of DSLA-LP token with slaId
     */
    function lpSymbolSlaId(uint128 slaId) external view virtual returns (string memory);

    /**
     * @dev returns the name of DSLA-SP token
     */
    function spName() external view virtual returns (string memory);

    /**
     * @dev returns the symbol of DSLA-SP token
     */
    function spSymbol() external view virtual returns (string memory);

    /**
     * @dev returns the symbol of DSLA-SP token with slaId
     */
    function spSymbolSlaId(uint128 slaId) external view virtual returns (string memory);

    function setChainlinkJobID(bytes32 _newJobId, uint256 _feeMultiplier)
        external
        virtual;

    function retryRequest(address _slaAddress, uint256 _periodId)
        external
        virtual;
}
