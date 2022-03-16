// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts/math/SafeMath.sol';
import './interfaces/IMessenger.sol';
import './interfaces/IMessengerRegistry.sol';
import './interfaces/IPeriodRegistry.sol';
import './interfaces/ISLA.sol';
import './interfaces/ISLARegistry.sol';
import './interfaces/ISLAFactory.sol';
import './interfaces/ISLORegistry.sol';
import './interfaces/IStakeRegistry.sol';

contract SLARegistry is ISLARegistry {
    using SafeMath for uint256;

    /// @dev SLO registry
    address private _sloRegistry;
    /// @dev Periods registry
    address private _periodRegistry;
    /// @dev Messengers registry
    address private _messengerRegistry;
    /// @dev Stake registry
    address private _stakeRegistry;
    /// @dev Stake registry
    address private _slaFactory;
    /// @dev stores the addresses of created SLAs
    address[] public SLAs;
    /// @dev stores the indexes of service level agreements owned by an user
    mapping(address => uint256[]) private _userToSLAIndexes;
    /// @dev to check if registered SLA
    mapping(address => bool) private _registeredSLAs;
    // value to lock past periods on SLA deployment
    bool private immutable _checkPastPeriod;

    event SLACreated(
        address indexed sla,
        address indexed owner
    );

    event SLIRequested(
        uint256 periodId,
        address indexed sla,
        address indexed caller
    );

    event ReturnLockedValue(
        address indexed sla,
        address indexed caller
    );

    constructor(
        address sloRegistry_,
        address periodRegistry_,
        address messengerRegistry_,
        address stakeRegistry_,
        address slaFactory_,
        bool checkPastPeriod_
    ) public {
        _sloRegistry = sloRegistry_;
        ISLORegistry(_sloRegistry).setSLARegistry();
        _periodRegistry = periodRegistry_;
        _stakeRegistry = stakeRegistry_;
        IStakeRegistry(_stakeRegistry).setSLARegistry();
        _messengerRegistry = messengerRegistry_;
        IMessengerRegistry(_messengerRegistry).setSLARegistry();
        _checkPastPeriod = checkPastPeriod_;
        _slaFactory = slaFactory_;
        ISLAFactory(_slaFactory).setSLARegistry();
    }

    function createSLA(
        uint256 sloValue_,
        ISLORegistry.SLOType sloType_,
        bool whitelisted_,
        address messengerAddress_,
        IPeriodRegistry.PeriodType periodType_,
        uint128 initialPeriodId_,
        uint128 finalPeriodId_,
        string memory ipfsHash_,
        bytes32[] memory extraData_,
        uint64 leverage_
    ) public {
        require(IPeriodRegistry(_periodRegistry).isValidPeriod(
            periodType_,
            initialPeriodId_
        ), 'first id invalid');
        require(IPeriodRegistry(_periodRegistry).isValidPeriod(
            periodType_,
            finalPeriodId_
        ), 'final id invalid');
        require(IPeriodRegistry(_periodRegistry)
            .isInitializedPeriod(periodType_), 'period not initialized');
        require(finalPeriodId_ >= initialPeriodId_, 'invalid final/initial');

        if (_checkPastPeriod) {
            require(!IPeriodRegistry(_periodRegistry)
                .periodHasStarted(periodType_, initialPeriodId_), 'past period');
        }
        require(IMessengerRegistry(_messengerRegistry)
            .registeredMessengers(messengerAddress_), 'invalid messenger');

        address newSLA = ISLAFactory(_slaFactory).createSLA(
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

        ISLORegistry(_sloRegistry).registerSLO(
            sloValue_,
            sloType_,
            newSLA
        );
        IStakeRegistry(_stakeRegistry).lockDSLAValue(
            msg.sender,
            newSLA,
            finalPeriodId_ - initialPeriodId_ + 1
        );
        SLAs.push(newSLA);
        _registeredSLAs[newSLA] = true;
        _userToSLAIndexes[msg.sender].push(SLAs.length.sub(1));
        emit SLACreated(newSLA, msg.sender);
    }

    function requestSLI(
        uint256 _periodId,
        address _sla,
        bool _ownerApproval
    ) public {
        require(isRegisteredSLA(_sla), 'invalid SLA');
        require(
            _periodId == ISLA(_sla).nextVerifiablePeriod(),
            'not nextVerifiablePeriod'
        );
        ISLA.PeriodSLI memory periodSli = ISLA(_sla).periodSLIs(_periodId);
        require(periodSli.status == ISLA.Status.NotVerified, 'invalid SLA status');
        bool slaAllowedPeriodId = ISLA(_sla).isAllowedPeriod(_periodId);
        require(slaAllowedPeriodId, 'invalid period');
        IPeriodRegistry.PeriodType slaPeriodType = ISLA(_sla).periodType();
        bool periodFinished = IPeriodRegistry(_periodRegistry).periodIsFinished(
            slaPeriodType,
            _periodId
        );
        require(periodFinished, 'period unfinished');
        address slaMessenger = ISLA(_sla).messengerAddress();
        emit SLIRequested(_periodId, _sla, msg.sender);
        IMessenger(slaMessenger).requestSLI(
            _periodId,
            _sla,
            _ownerApproval,
            msg.sender
        );
        IStakeRegistry(_stakeRegistry).distributeVerificationRewards(
            _sla,
            msg.sender,
            _periodId
        );
    }

    function returnLockedValue(address _sla) public {
        require(isRegisteredSLA(_sla), 'invalid SLA');
        require(msg.sender == ISLA(_sla).owner(), 'msg.sender not owner');
        uint256 lastValidPeriodId = ISLA(_sla).finalPeriodId();
        IPeriodRegistry.PeriodType periodType = ISLA(_sla).periodType();
        (, uint256 endOfLastValidPeriod) = IPeriodRegistry(_periodRegistry)
            .getPeriodStartAndEnd(periodType, lastValidPeriodId);

        ISLA.PeriodSLI memory lastPeriodSLI = ISLA(_sla).periodSLIs(lastValidPeriodId);
        require(
            (block.timestamp >= endOfLastValidPeriod &&
                lastPeriodSLI.status != ISLA.Status.NotVerified),
            'not finished contract'
        );
        emit ReturnLockedValue(_sla, msg.sender);
        IStakeRegistry(_stakeRegistry).returnLockedValue(_sla);
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

    function userSLAs(address _user) public view returns (address[] memory) {
        address[] memory SLAList = new address[](_userToSLAIndexes[_user].length);
        for (uint256 i = 0; i < _userToSLAIndexes[_user].length; i++) {
            SLAList[i] = (SLAs[_userToSLAIndexes[_user][i]]);
        }
        return (SLAList);
    }

    function allSLAs() public view returns (address[] memory) {
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
