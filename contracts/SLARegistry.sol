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
        require(
            IPeriodRegistry(_periodRegistry).isValidPeriod(
                periodType_,
                initialPeriodId_
            ),
            'first id invalid'
        );
        require(
            IPeriodRegistry(_periodRegistry).isValidPeriod(
                periodType_,
                finalPeriodId_
            ),
            'final id invalid'
        );
        require(
            IPeriodRegistry(_periodRegistry).isInitializedPeriod(periodType_),
            'period not initialized'
        );
        require(finalPeriodId_ >= initialPeriodId_, 'invalid final/initial');

        if (_checkPastPeriod) {
            require(
                !IPeriodRegistry(_periodRegistry).periodHasStarted(
                    periodType_,
                    initialPeriodId_
                ),
                'past period'
            );
        }
        require(
            IMessengerRegistry(_messengerRegistry).registeredMessengers(
                messengerAddress_
            ),
            'invalid messenger'
        );

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
    ) public nonReentrant {
        require(isRegisteredSLA(address(_sla)), 'This SLA is not valid.');
        require(
            _periodId == _sla.nextVerifiablePeriod(),
            'not nextVerifiablePeriod'
        );
        (, , SLA.Status status) = _sla.periodSLIs(_periodId);
        require(
            status == SLA.Status.NotVerified,
            'This SLA has already been verified.'
        );
        require(_sla.isAllowedPeriod(_periodId), 'invalid period');
        require(
            IPeriodRegistry(_periodRegistry).periodIsFinished(
                _sla.periodType(),
                _periodId
            ),
            'period unfinished'
        );
        emit SLIRequested(_periodId, address(_sla), msg.sender);
        IMessenger(_sla.messengerAddress()).requestSLI(
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
        require(isRegisteredSLA(address(_sla)), 'This SLA is not valid.');
        require(msg.sender == _sla.owner(), 'Only the SLA owner can do this.');
        uint256 finalPeriodId = _sla.finalPeriodId();
        (, uint256 endOfLastValidPeriod) = IPeriodRegistry(_periodRegistry)
            .getPeriodStartAndEnd(_sla.periodType(), finalPeriodId);

        (, , SLA.Status lastPeriodStatus) = _sla.periodSLIs(finalPeriodId);
        require(
            (block.timestamp >= endOfLastValidPeriod &&
                lastPeriodStatus != SLA.Status.NotVerified),
            'This SLA has not terminated.'
        );
        emit ReturnLockedValue(address(_sla), msg.sender);
        IStakeRegistry(_stakeRegistry).returnLockedValue(address(_sla));
    }

    function registerMessenger(
        address _messengerAddress,
        string memory _specificationUrl
    ) public nonReentrant {
        IMessenger(_messengerAddress).setSLARegistry();
        IMessengerRegistry(_messengerRegistry).registerMessenger(
            msg.sender,
            _messengerAddress,
            _specificationUrl
        );
    }

    function userSLAs(address _user)
        public
        view
        returns (SLA[] memory SLAList)
    {
        uint256 count = _userToSLAIndexes[_user].length;
        SLAList = new SLA[](count);

        for (uint256 i = 0; i < count; i++) {
            SLAList[i] = (SLAs[_userToSLAIndexes[_user][i]]);
        }
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
