// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import '@chainlink/contracts/src/v0.8/ChainlinkClient.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

import '../interfaces/IMessenger.sol';
import '../SLA.sol';
import '../PeriodRegistry.sol';
import '../StakeRegistry.sol';
import '../libraries/StringUtils.sol';

contract MockMessenger is IMessenger, ReentrancyGuard {
    using SafeERC20 for ERC20;
    using Chainlink for Chainlink.Request;

    mapping(bytes32 => SLIRequest) public requestIdToSLIRequest;
    bytes32[] public requests;
    address private _slaRegistryAddress;
    address private immutable _oracle;
    bytes32 private _jobId;
    uint256 private constant _baseFee = 0.1 ether;
    uint256 private _fee;
    uint256 private constant _messengerPrecision = 10**3;

    uint256 private _requestsCounter;
    uint256 private _fulfillsCounter;
    PeriodRegistry private periodRegistry;
    StakeRegistry private stakeRegistry;
    bool private retry = false;
    bytes32 public networkName;

    string public override lpName;
    string public override lpSymbol;

    string public override spName;
    string public override spSymbol;

    constructor(
        address _messengerChainlinkOracle,
        address,
        uint256 _feeMultiplier,
        PeriodRegistry _periodRegistry,
        StakeRegistry _stakeRegistry,
        bytes32 _networkName,
        string memory _lpName,
        string memory _lpSymbol,
        string memory _spName,
        string memory _spSymbol
    ) {
        _oracle = _messengerChainlinkOracle;
        _fee = _feeMultiplier * _baseFee;
        periodRegistry = _periodRegistry;
        stakeRegistry = _stakeRegistry;
        networkName = _networkName;
        lpName = _lpName;
        lpSymbol = _lpSymbol;
        spName = _spName;
        spSymbol = _spSymbol;
    }

    event JobIdModified(address indexed owner, bytes32 jobId, uint256 fee);

    event SLIRequested(
        address indexed caller,
        uint256 requestsCounter,
        bytes32 requestId
    );

    modifier onlySLARegistry() {
        if (!retry) {
            require(
                msg.sender == _slaRegistryAddress,
                'Can only be called by SLARegistry'
            );
        }
        _;
    }

    modifier retryLock() {
        retry = true;
        _;
        retry = false;
    }

    function setSLARegistry() public override {
        require(
            _slaRegistryAddress == address(0),
            'SLARegistry address has already been set'
        );

        _slaRegistryAddress = msg.sender;
    }

    function requestSLI(
        uint256 _periodId,
        address _slaAddress,
        bool,
        address _callerAddress
    ) public override onlySLARegistry nonReentrant {
        bytes32 requestId = bytes32(_periodId);
        requestIdToSLIRequest[requestId] = SLIRequest({
            slaAddress: _slaAddress,
            periodId: _periodId
        });

        _requestsCounter += 1;
        emit SLIRequested(_callerAddress, _requestsCounter, requestId);
    }

    function mockFulfillSLI(uint256 _periodId, uint256 _chainlinkResponse)
        external
    {
        fulfillSLI(bytes32(_periodId), _chainlinkResponse);
    }

    function fulfillSLI(bytes32 _requestId, uint256 _chainlinkResponse)
        public
        override
        nonReentrant
    {
        SLIRequest memory request = requestIdToSLIRequest[_requestId];
        emit SLIReceived(
            request.slaAddress,
            request.periodId,
            _requestId,
            bytes32(_chainlinkResponse)
        );
        _fulfillsCounter += 1;
        SLA(request.slaAddress).registerSLI(
            _chainlinkResponse,
            request.periodId
        );
    }

    function retryRequest(address _slaAddress, uint256 _periodId)
        external
        override
    {}

    function setChainlinkJobID(bytes32 _newJobId, uint256 _feeMultiplier)
        external
        override
    {}

    function slaRegistryAddress() external view override returns (address) {
        return _slaRegistryAddress;
    }

    function messengerPrecision() external pure override returns (uint256) {
        return _messengerPrecision;
    }

    function oracle() external view override returns (address) {
        return _oracle;
    }

    function jobId() external view override returns (bytes32) {
        return _jobId;
    }

    function fee() external view override returns (uint256) {
        return _fee;
    }

    function requestsCounter() external view override returns (uint256) {
        return _requestsCounter;
    }

    function fulfillsCounter() external view override returns (uint256) {
        return _fulfillsCounter;
    }

    function lpSymbolSlaId(uint128 slaId)
        external
        view
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(lpSymbol, '-', StringUtils.uintToStr(slaId))
            );
    }

    function spSymbolSlaId(uint128 slaId)
        external
        view
        override
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(spSymbol, '-', StringUtils.uintToStr(slaId))
            );
    }
}
