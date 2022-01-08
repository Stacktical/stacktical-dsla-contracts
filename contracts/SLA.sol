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
    address public immutable messengerAddress;
    ISLARegistry private _slaRegistry;
    IPeriodRegistry private immutable _periodRegistry;
    SLORegistry private immutable _sloRegistry;
    uint256 public immutable creationBlockNumber;
    uint128 public immutable initialPeriodId;
    uint128 public immutable finalPeriodId;
    IPeriodRegistry.PeriodType public immutable periodType;
    /// @dev extra data for customized workflows
    bytes32[] public extraData;

    bool public userWithdrawLocked = true;
    uint256 public nextVerifiablePeriod;

    /// @dev periodId=>PeriodSLI mapping
    mapping(uint256 => PeriodSLI) public periodSLIs;

    event SLICreated(uint256 timestamp, uint256 sli, uint256 periodId);

    event Stake(
        address indexed tokenAddress,
        uint256 indexed periodId,
        address indexed caller,
        uint256 amount
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
            _owner
        )
    {
        transferOwnership(_owner);
        ipfsHash = _ipfsHash;
        messengerAddress = _messengerAddress;
        _slaRegistry = ISLARegistry(msg.sender);
        _periodRegistry = IPeriodRegistry(_slaRegistry.periodRegistry());
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
        (uint256 sloValue, ) = _sloRegistry.registeredSLO(address(this));

        uint256 precision = 10000;

        int256 deviation = _sli.sub(sloValue).mul(precision).div(
            _sli.add(sloValue).div(2)
        );

        if (deviation < 0) {
            deviation = deviation.mul(-1);
        }

        uint256 normalizedPeriodId = _periodId.sub(initialPeriodId).add(1);

        uint256 rewardPercentage = deviation.mul(normalizedPeriodId).div(
            finalPeriodId - initialPeriodId + 1
        );

        if (_sloRegistry.isRespected(_sli, address(this))) {
            periodSLI.status = Status.Respected;

            _setRespectedPeriodReward(_periodId, rewardPercentage, precision);
        } else {
            periodSLI.status = Status.NotRespected;

            _setUsersCompensation(_periodId, rewardPercentage, precision);
        }
    }

    function isAllowedPeriod(uint256 _periodId) external view returns (bool) {
        if (_periodId < initialPeriodId) return false;
        if (_periodId > finalPeriodId) return false;
        return true;
    }

    function contractFinished() public view returns (bool) {
        (, uint256 endOfLastValidPeriod) = _periodRegistry.getPeriodStartAndEnd(
            periodType,
            finalPeriodId
        );
        return
            (block.timestamp >= endOfLastValidPeriod &&
                periodSLIs[finalPeriodId].status != Status.NotVerified);
    }

    function stakeTokens(uint256 _amount, address _token) external {
        bool isContractFinished = contractFinished();
        require(!isContractFinished, 'finished contract');
        _stake(_amount, _token);
        emit Stake(_token, nextVerifiablePeriod, msg.sender, _amount);
        IStakeRegistry stakeRegistry = IStakeRegistry(
            _slaRegistry.stakeRegistry()
        );
        stakeRegistry.registerStakedSla(msg.sender);
    }

    function withdrawProviderTokens(uint256 _amount, address _tokenAddress)
        external
    {
        bool isContractFinished = contractFinished();
        emit ProviderWithdraw(
            _tokenAddress,
            nextVerifiablePeriod,
            msg.sender,
            _amount
        );
        _withdrawProviderTokens(_amount, _tokenAddress, isContractFinished);
    }

    function withdrawUserTokens(uint256 _amount, address _tokenAddress)
        external
    {
        if (msg.sender != owner() && userWithdrawLocked) {
            bool isContractFinished = contractFinished();
            require(isContractFinished, 'not finished');
        }
        emit UserWithdraw(
            _tokenAddress,
            nextVerifiablePeriod,
            msg.sender,
            _amount
        );
        _withdrawUserTokens(_amount, _tokenAddress);
    }

    function toggleUserWithdrawLocked() external onlyOwner {
        userWithdrawLocked = !userWithdrawLocked;
    }

    function getStakersLength() external view returns (uint256) {
        return stakers.length;
    }
}
