// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/ISLARegistry.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './interfaces/ISLORegistry.sol';
import './Staking.sol';

/**
 @title Service Level Agreement Contract
 */
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

    string public ipfsHash;
    ISLARegistry private _slaRegistry;
    ISLORegistry private immutable _sloRegistry;
    uint256 public immutable creationBlockNumber;
    uint128 public immutable initialPeriodId;
    uint128 public immutable finalPeriodId;
    IPeriodRegistry.PeriodType public immutable periodType;
    /// @dev extra data for customized workflows
    bytes32[] public extraData;

    uint256 public nextVerifiablePeriod;

    /// @dev periodId=>PeriodSLI mapping
    mapping(uint256 => PeriodSLI) public periodSLIs;

    /// @notice An event that is emitted when creating new SLI
    event SLICreated(uint256 timestamp, uint256 sli, uint256 periodId);

    /// @notice An event that is emitted when staking in User or Provider Pool
    event Stake(
        address indexed tokenAddress,
        uint256 indexed periodId,
        address indexed caller,
        uint256 amount,
        Position position
    );
    /// @notice An event that is emitted when withdrawing from Provider Pool
    event ProviderWithdraw(
        address indexed tokenAddress,
        uint256 indexed periodId,
        address indexed caller,
        uint256 amount
    );

    /// @notice An event that is emitted when withdrawing from User Pool
    event UserWithdraw(
        address indexed tokenAddress,
        uint256 indexed periodId,
        address indexed caller,
        uint256 amount
    );

    /// @dev Modifier ensuring that certain function can only be called by Messenger
    modifier onlyMessenger() {
        require(msg.sender == messengerAddress, 'not messenger');
        _;
    }

    /// @dev Modifier ensuring that certain function can only be called by SLARegistry
    modifier onlySLARegistry() {
        require(msg.sender == address(_slaRegistry), 'not SLARegistry');
        _;
    }

    /**
     * @notice Constructor
     */
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
        _sloRegistry = ISLORegistry(_slaRegistry.sloRegistry());
        creationBlockNumber = block.number;
        initialPeriodId = _initialPeriodId;
        finalPeriodId = _finalPeriodId;
        periodType = _periodType;
        extraData = _extraData;
        nextVerifiablePeriod = _initialPeriodId;
    }

    /**
     * @notice External function that registers new SLI
     * @param _sli sli value to register
     * @param _periodId period id of new sli
     */
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

    /**
     @notice External view function to see if a period id is allowed or not
     @param _periodId period id to check
     @return bool allowed or not
     */
    function isAllowedPeriod(uint256 _periodId) external view returns (bool) {
        return _periodId >= initialPeriodId && _periodId <= finalPeriodId;
    }

    /**
     * @notice Public view function to check if the contract is terminated
     * @dev finish condition = should pass last verified period and final period should not be verified.
     * @return Bool whether finished or not
     */
    function contractFinished() public view returns (bool) {
        (, uint256 endOfLastValidPeriod) = _periodRegistry.getPeriodStartAndEnd(
            periodType,
            finalPeriodId
        );
        return (block.timestamp >= endOfLastValidPeriod &&
            periodSLIs[finalPeriodId].status != Status.NotVerified);
    }

    /**
     * @notice External function to stake tokens on User or Provider Pools
     * @param _amount amount to withdraw
     * @param _tokenAddress token address to withdraw
     * @param _position User or Provider pool
     */
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

        IStakeRegistry(_slaRegistry.stakeRegistry()).registerStakedSla(
            msg.sender
        );
    }

    /**
     * @notice External function to withdraw staked tokens from Provider Pool
     * @param _amount amount to withdraw
     * @param _tokenAddress token address to withdraw
     */
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

    /**
     * @notice External function to withdraw staked tokens from User Pool
     * @param _amount amount to withdraw
     * @param _tokenAddress token address to withdraw
     */
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

    /**
     * @notice External view function that returns the number of stakers
     * @return Uint256 number of stakers
     */
    function getStakersLength() external view returns (uint256) {
        return stakers.length;
    }
}
