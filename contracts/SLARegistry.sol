// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/ReentrancyGuard.sol';
import './SLA.sol';
import './SLORegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './interfaces/IMessengerRegistry.sol';
import './interfaces/IStakeRegistry.sol';
import './interfaces/IMessenger.sol';
import './interfaces/ISLARegistry.sol';

contract SLARegistry is ISLARegistry, ReentrancyGuard {
    using SafeMath for uint256;

    /// @dev SLO registry
    address private _sloRegistry;
    /// @dev Periods registry
    address private _periodRegistry;
    /// @dev Messengers registry
    address private _messengerRegistry;
    /// @dev Stake registry
    address private _stakeRegistry;
    /// @dev stores the addresses of created SLAs
    SLA[] public SLAs;
    /// @dev stores the indexes of service level agreements owned by an user
    mapping(address => uint256[]) private _userToSLAIndexes;
    /// @dev to check if registered SLA
    mapping(address => bool) private _registeredSLAs;
    // value to lock past periods on SLA deployment
    bool private immutable _checkPastPeriod;

    event SLACreated(SLA indexed sla, address indexed owner);

    event SLIRequested(
        uint256 periodId,
        address indexed sla,
        address indexed caller
    );

    event ReturnLockedValue(address indexed sla, address indexed caller);

    constructor(
        address sloRegistry_,
        address periodRegistry_,
        address messengerRegistry_,
        address stakeRegistry_,
        bool checkPastPeriod_
    ) public {
        _sloRegistry = sloRegistry_;
        SLORegistry(_sloRegistry).setSLARegistry();
        _periodRegistry = periodRegistry_;
        _stakeRegistry = stakeRegistry_;
        IStakeRegistry(_stakeRegistry).setSLARegistry();
        _messengerRegistry = messengerRegistry_;
        IMessengerRegistry(_messengerRegistry).setSLARegistry();
        _checkPastPeriod = checkPastPeriod_;
    }

    function createSLA(
        uint256 sloValue_,
        SLORegistry.SLOType sloType_,
        bool whitelisted_,
        address messengerAddress_,
        IPeriodRegistry.PeriodType periodType_,
        uint128 initialPeriodId_,
        uint128 finalPeriodId_,
        string memory ipfsHash_,
        bytes32[] memory extraData_,
        uint64 leverage_
    ) public nonReentrant {
        bool validPeriod = IPeriodRegistry(_periodRegistry).isValidPeriod(
            periodType_,
            initialPeriodId_
        );
        require(validPeriod, 'first id invalid');
        validPeriod = IPeriodRegistry(_periodRegistry).isValidPeriod(
            periodType_,
            finalPeriodId_
        );
        require(validPeriod, 'final id invalid');
        bool initializedPeriod = IPeriodRegistry(_periodRegistry)
            .isInitializedPeriod(periodType_);
        require(initializedPeriod, 'period not initialized');
        require(finalPeriodId_ >= initialPeriodId_, 'invalid final/initial');

        if (_checkPastPeriod) {
            bool periodHasStarted = IPeriodRegistry(_periodRegistry)
                .periodHasStarted(periodType_, initialPeriodId_);
            require(!periodHasStarted, 'past period');
        }
        bool registeredMessenger = IMessengerRegistry(_messengerRegistry)
            .registeredMessengers(messengerAddress_);
        require(registeredMessenger, 'invalid messenger');

        SLA sla = new SLA(
            msg.sender,
            whitelisted_,
            periodType_,
            messengerAddress_,
            initialPeriodId_,
            finalPeriodId_,
            uint128(SLAs.length),
            ipfsHash_,
            extraData_,
            leverage_
        );

        SLORegistry(_sloRegistry).registerSLO(
            sloValue_,
            sloType_,
            address(sla)
        );
        IStakeRegistry(_stakeRegistry).lockDSLAValue(
            msg.sender,
            address(sla),
            finalPeriodId_ - initialPeriodId_ + 1
        );
        SLAs.push(sla);
        _registeredSLAs[address(sla)] = true;
        uint256 index = SLAs.length.sub(1);
        _userToSLAIndexes[msg.sender].push(index);
        emit SLACreated(sla, msg.sender);
    }

    function requestSLI(
        uint256 _periodId,
        SLA _sla,
        bool _ownerApproval
    ) public {
        require(isRegisteredSLA(address(_sla)), 'invalid SLA');
        require(
            _periodId == _sla.nextVerifiablePeriod(),
            'not nextVerifiablePeriod'
        );
        (, , SLA.Status status) = _sla.periodSLIs(_periodId);
        require(status == SLA.Status.NotVerified, 'invalid SLA status');
        bool slaAllowedPeriodId = _sla.isAllowedPeriod(_periodId);
        require(slaAllowedPeriodId, 'invalid period');
        IPeriodRegistry.PeriodType slaPeriodType = _sla.periodType();
        bool periodFinished = IPeriodRegistry(_periodRegistry).periodIsFinished(
            slaPeriodType,
            _periodId
        );
        require(periodFinished, 'period unfinished');
        address slaMessenger = _sla.messengerAddress();
        emit SLIRequested(_periodId, address(_sla), msg.sender);
        IMessenger(slaMessenger).requestSLI(
            _periodId,
            address(_sla),
            _ownerApproval,
            msg.sender
        );
        IStakeRegistry(_stakeRegistry).distributeVerificationRewards(
            address(_sla),
            msg.sender,
            _periodId
        );
    }

    function returnLockedValue(SLA _sla) public {
        require(isRegisteredSLA(address(_sla)), 'invalid SLA');
        require(msg.sender == _sla.owner(), 'msg.sender not owner');
        uint256 lastValidPeriodId = _sla.finalPeriodId();
        IPeriodRegistry.PeriodType periodType = _sla.periodType();
        (, uint256 endOfLastValidPeriod) = IPeriodRegistry(_periodRegistry)
            .getPeriodStartAndEnd(periodType, lastValidPeriodId);

        (, , SLA.Status lastPeriodStatus) = _sla.periodSLIs(lastValidPeriodId);
        require(
            (block.timestamp >= endOfLastValidPeriod &&
                lastPeriodStatus != SLA.Status.NotVerified),
            'not finished contract'
        );
        emit ReturnLockedValue(address(_sla), msg.sender);
        IStakeRegistry(_stakeRegistry).returnLockedValue(address(_sla));
    }

    function registerMessenger(
        address _messengerAddress,
        string memory _specificationUrl
    ) public {
        IMessenger(_messengerAddress).setSLARegistry();
        IMessengerRegistry(_messengerRegistry).registerMessenger(
            msg.sender,
            _messengerAddress,
            _specificationUrl
        );
    }

    function userSLAs(address _user) public view returns (SLA[] memory) {
        uint256 count = _userToSLAIndexes[_user].length;
        SLA[] memory SLAList = new SLA[](count);
        uint256[] memory userSLAIndexes = _userToSLAIndexes[_user];

        for (uint256 i = 0; i < count; i++) {
            SLAList[i] = (SLAs[userSLAIndexes[i]]);
        }

        return (SLAList);
    }

    function allSLAs() public view returns (SLA[] memory) {
        return (SLAs);
    }

    function isRegisteredSLA(address _slaAddress)
        public
        view
        override
        returns (bool)
    {
        return _registeredSLAs[_slaAddress];
    }

    function sloRegistry() external view override returns (address) {
        return _sloRegistry;
    }

    function periodRegistry() external view override returns (address) {
        return _periodRegistry;
    }

    function messengerRegistry() external view override returns (address) {
        return _messengerRegistry;
    }

    function stakeRegistry() external view override returns (address) {
        return _stakeRegistry;
    }

    function checkPastPeriod() external view returns (bool) {
        return _checkPastPeriod;
    }
}
