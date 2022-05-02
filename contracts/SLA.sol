// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/ISLARegistry.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './SLORegistry.sol';
import './Staking.sol';

contract SLA is Staking {
    using SafeMath for uint256;

    enum Status {
        NotVerified,
        Respected,
        NotRespected
    }

    struct PeriodSLI {
        uint256 timestamp;
        uint256 sli;
        Status status;
    }

    //
    string public ipfsHash;
    ISLARegistry private _slaRegistry;
    SLORegistry private immutable _sloRegistry;
    uint256 public immutable creationBlockNumber;
    uint128 public immutable initialPeriodId;
    uint128 public immutable finalPeriodId;
    IPeriodRegistry.PeriodType public immutable periodType;
    /// @dev extra data for customized workflows
    bytes32[] public extraData;

    uint256 public nextVerifiablePeriod;

    /// @dev periodId=>PeriodSLI mapping
    mapping(uint256 => PeriodSLI) public periodSLIs;

    event SLICreated(uint256 timestamp, uint256 sli, uint256 periodId);

    event Stake(
        address indexed tokenAddress,
        uint256 indexed periodId,
        address indexed caller,
        uint256 amount,
        Position position
    );
    event ProviderWithdraw(
        address indexed tokenAddress,
        uint256 indexed periodId,
        address indexed caller,
        uint256 amount
    );
    event UserWithdraw(
        address indexed tokenAddress,
        uint256 indexed periodId,
        address indexed caller,
        uint256 amount
    );

    modifier onlyMessenger() {
        require(msg.sender == messengerAddress, 'not messenger');
        _;
    }

    modifier onlyISLARegistry() {
        require(msg.sender == address(_slaRegistry), 'not ISLARegistry');
        _;
    }

    constructor(
        address _owner,
        bool _whitelisted,
        IPeriodRegistry.PeriodType _periodType,
        address _messengerAddress,
        uint128 _initialPeriodId,
        uint128 _finalPeriodId,
        uint128 _slaID,
        string memory _ipfsHash,
        bytes32[] memory _extraData,
        uint64 _leverage
    )
        public
        Staking(
            ISLARegistry(msg.sender),
            _whitelisted,
            _slaID,
            _leverage,
            _owner,
            _messengerAddress
        )
    {
        transferOwnership(_owner);
        ipfsHash = _ipfsHash;
        _slaRegistry = ISLARegistry(msg.sender);
        _sloRegistry = SLORegistry(_slaRegistry.sloRegistry());
        creationBlockNumber = block.number;
        initialPeriodId = _initialPeriodId;
        finalPeriodId = _finalPeriodId;
        periodType = _periodType;
        extraData = _extraData;
        nextVerifiablePeriod = _initialPeriodId;
    }

    function registerSLI(uint256 _sli, uint256 _periodId)
        external
        onlyMessenger
    {
        emit SLICreated(block.timestamp, _sli, _periodId);
        nextVerifiablePeriod = _periodId + 1;
        PeriodSLI storage periodSLI = periodSLIs[_periodId];
        periodSLI.sli = _sli;
        periodSLI.timestamp = block.timestamp;

        uint256 deviation = _sloRegistry.getDeviation(
            _sli,
            address(this),
            10000
        );

        if (_sloRegistry.isRespected(_sli, address(this))) {
            periodSLI.status = Status.Respected;
            _setProviderReward(_periodId, deviation, 10000);
        } else {
            periodSLI.status = Status.NotRespected;
            _setUserReward(_periodId, deviation, 10000);
        }
    }

    function isAllowedPeriod(uint256 _periodId) external view returns (bool) {
        return _periodId >= initialPeriodId && _periodId <= finalPeriodId;
    }

    function contractFinished() public view returns (bool) {
        (, uint256 endOfLastValidPeriod) = _periodRegistry.getPeriodStartAndEnd(
            periodType,
            finalPeriodId
        );
        return (block.timestamp >= endOfLastValidPeriod &&
            periodSLIs[finalPeriodId].status != Status.NotVerified);
    }

    function stakeTokens(
        uint256 _amount,
        address _tokenAddress,
        Position _position
    ) external {
        require(!contractFinished(), 'This SLA has terminated.');

        require(_amount > 0, 'Stake must be greater than 0.');

        _stake(_tokenAddress, nextVerifiablePeriod, _amount, _position);

        emit Stake(
            _tokenAddress,
            nextVerifiablePeriod,
            msg.sender,
            _amount,
            _position
        );

        IStakeRegistry(_slaRegistry.stakeRegistry()).registerStakedSla(msg.sender);
    }

    function withdrawProviderTokens(uint256 _amount, address _tokenAddress)
        external
    {
        emit ProviderWithdraw(
            _tokenAddress,
            nextVerifiablePeriod,
            msg.sender,
            _amount
        );

        _withdrawProviderTokens(
            _amount,
            _tokenAddress,
            nextVerifiablePeriod,
            contractFinished()
        );
    }

    function withdrawUserTokens(uint256 _amount, address _tokenAddress)
        external
    {
        emit UserWithdraw(
            _tokenAddress,
            nextVerifiablePeriod,
            msg.sender,
            _amount
        );
        _withdrawUserTokens(
            _amount,
            _tokenAddress,
            nextVerifiablePeriod,
            contractFinished()
        );
    }

    function getStakersLength() external view returns (uint256) {
        return stakers.length;
    }
}
