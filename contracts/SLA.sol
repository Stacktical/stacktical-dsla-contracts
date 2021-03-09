// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SLO.sol";
import "./SLARegistry.sol";
import "./StakeRegistry.sol";
import "./PeriodRegistry.sol";
import "./Staking.sol";

/**
 * @title SLA
 * @dev SLA is a service level agreement contract used for service downtime
 * compensation
 */
contract SLA is Staking {
    using SafeMath for uint256;

    enum Status {NotVerified, Respected, NotRespected}

    /// @dev Struct used for storing period status
    struct PeriodSLI {
        uint256 timestamp;
        uint256 sli;
        Status status;
    }

    /// @dev address of the SLO
    SLO public slo;

    /// @dev The ipfs hash that stores extra information about the agreement
    string public ipfsHash;

    /// @dev uint8 of the period type
    PeriodRegistry.PeriodType public periodType;

    PeriodRegistry public periodRegistry;

    /// @dev array of he allowed canonical period ids
    uint256[] public periodIds;

    /// @dev The address of the slaRegistry contract
    SLARegistry public slaRegistry;

    /// @dev The address of the messenger
    address public messengerAddress;

    /// @dev states if the contract was breached or not
    bool private _breachedContract = false;

    /// @dev periodId=>PeriodSLI mapping
    mapping(uint256 => PeriodSLI) public periodSLIs;

    /// @dev block number of SLA deployment
    uint256 public creationBlockNumber;

    /// @dev extra data for customized workflows
    bytes32[] public extraData;

    /// @dev states if the contract was breached or not
    uint256 public nextVerifiablePeriod;

    /**
     * @dev event for SLI creation logging
     * @param timestamp 1. the time the SLI has been registered
     * @param sli 2. the value of the SLI
     * @param periodId 3. the id of the given period
     */
    event SLICreated(uint256 timestamp, uint256 sli, uint256 periodId);

    /**
     * @dev event for SLI creation logging
     * @param _periodId 1. the id of the given period
     * @param _sli 2. value of the SLI
     */
    event SLANotRespected(uint256 _periodId, uint256 _sli);

    /**
     * @dev throws if called by any address other than the messenger contract.
     */
    modifier onlyMessenger() {
        require(
            msg.sender == messengerAddress,
            "Only Messenger can call this function"
        );
        _;
    }

    /**
     * @dev throws if called by any address other than the messenger contract.
     */
    modifier onlySLARegistry() {
        require(
            msg.sender == address(slaRegistry),
            "Only SLARegistry can call this function"
        );
        _;
    }

    /**
     * @param _owner 1. address of the owner of the service level agreement
     * @param _SLO 2. address of the SLO
     * @param _ipfsHash 3. string with the ipfs hash that contains SLA information
     * @param _periodIds 4. id of the allowed canonical periods
     * @param _periodType 5. period type of the SLA contract
     * @param _stakeRegistry 6. stakeRegistry address
     * @param _periodRegistry 7. periodRegistry address
     * @param _whitelisted 8. boolean to declare whitelisted contracts
     * @param _extraData 9. array of bytes32 to store extra data on deployment time
     * @param _slaID 10. identifies the SLA to uniquely to emit dTokens
     */
    constructor(
        address _owner,
        SLO _SLO,
        string memory _ipfsHash,
        address _messengerAddress,
        uint256[] memory _periodIds,
        PeriodRegistry.PeriodType _periodType,
        address _stakeRegistry,
        address _periodRegistry,
        bool _whitelisted,
        bytes32[] memory _extraData,
        uint256 _slaID
    )
        public
        Staking(
            _stakeRegistry,
            _periodRegistry,
            _periodType,
            _periodIds.length,
            _whitelisted,
            _slaID
        )
    {
        transferOwnership(_owner);
        ipfsHash = _ipfsHash;
        messengerAddress = _messengerAddress;
        slaRegistry = SLARegistry(msg.sender);
        periodRegistry = PeriodRegistry(_periodRegistry);
        creationBlockNumber = block.number;
        periodIds = _periodIds;
        periodType = _periodType;
        slo = _SLO;
        extraData = _extraData;
        nextVerifiablePeriod = _periodIds[0];
    }

    /**
     * @dev external function to register SLI's and check them against the SLO's
     * @param _sli 1. the value of the SLI to check
     * @param _periodId 2. the id of the given period
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
        uint256 sloValue = slo.value();
        if (slo.isRespected(_sli)) {
            periodSLI.status = Status.Respected;
            uint256 precision = 10000;
            // deviation = (sli-slo)*precision/((sli+slo)/2)
            uint256 deviation =
                _sli.sub(sloValue).mul(precision).div(
                    _sli.add(sloValue).div(2)
                );
            // to get the reward formula, we get the periodId but respecting to the SLA
            // because _periodId is the periodId of the platform
            // e.g. if periodIds = 7,8,9,10, normalized periods are = 1,2,3,4
            uint256 normalizedPeriodId = _periodId.sub(periodIds[0]).add(1);
            // if is the last period, then deliver the whole usersStake to the provider
            // uint256 rewardPercentage =
            //     _periodId != periodIds[periodIds.length - 1] &&
            //         ? deviation.mul(normalizedPeriodId).div(periodIds.length)
            //         : uint256(1).mul(precision);
            uint256 rewardPercentage =
                deviation.mul(normalizedPeriodId).div(periodIds.length);
            _setRespectedPeriodReward(_periodId, rewardPercentage, precision);
        } else {
            periodSLI.status = Status.NotRespected;
            _setUsersCompensation();
            _breachedContract = true;
            emit SLANotRespected(_periodId, _sli);
        }
    }

    function isAllowedPeriod(uint256 _periodId) public view returns (bool) {
        for (uint256 index = 0; index < periodIds.length; index++) {
            if (periodIds[index] == _periodId) {
                return true;
            }
        }
        return false;
    }

    /**
     *@dev stake _amount tokens into the _token contract
     *@param _amount 1. amount to be staked
     *@param _token 2. address of the ERC to be staked
     */

    function stakeTokens(uint256 _amount, address _token) public {
        require(_amount > 0, "amount cannot be 0");
        require(
            _breachedContract == false,
            "Can only stake on not breached contracts"
        );
        _stake(_amount, _token);
        StakeRegistry stakeRegistry = slaRegistry.stakeRegistry();
        stakeRegistry.registerStakedSla(msg.sender);
    }

    function withdrawProviderTokens(uint256 _amount, address _tokenAddress)
        public
    {
        require(_amount > 0, "amount cannot be 0");
        uint256 lastValidPeriodId = periodIds[periodIds.length - 1];
        (, uint256 endOfLastValidPeriod) =
            periodRegistry.getPeriodStartAndEnd(periodType, lastValidPeriodId);
        // contract is finished if is breached or if the last period is finished and verified
        bool contractFinished =
            _breachedContract == true ||
                (block.timestamp >= endOfLastValidPeriod &&
                    periodSLIs[lastValidPeriodId].status != Status.NotVerified);
        _withdrawProviderTokens(_amount, _tokenAddress, contractFinished);
    }

    /**
     *@dev withdraw _amount tokens from the _token contract
     *@param _amount 1. amount to be staked
     *@param _tokenAddress 2. address of the ERC to be staked
     */

    function withdrawUserTokens(uint256 _amount, address _tokenAddress) public {
        require(_amount > 0, "amount cannot be 0");
        uint256 lastValidPeriodId = periodIds[periodIds.length - 1];
        (, uint256 endOfLastValidPeriod) =
            periodRegistry.getPeriodStartAndEnd(periodType, lastValidPeriodId);
        // users tokens can be withdrawn only if the contract is breached
        // or if the last period is finished and the period status was verified
        if (msg.sender != owner()) {
            require(
                _breachedContract == true ||
                    (block.timestamp >= endOfLastValidPeriod &&
                        periodSLIs[lastValidPeriodId].status !=
                        Status.NotVerified),
                "Can only withdraw stake after the final period is finished or if the contract is breached"
            );
        }
        _withdrawUserTokens(_amount, _tokenAddress);
    }

    /**
     *@dev withdraw provider reward of a given token address
     *@param _tokenAddress 1. address of the token to withdraw rewards
     */

    function claimUserCompensation(address _tokenAddress) public {
        _claimCompensation(_tokenAddress);
    }

    function getPeriodIdsLength() public view returns (uint256) {
        return periodIds.length;
    }

    function getStakersLength() public view returns (uint256) {
        return stakers.length;
    }

    function breachedContract() public view returns (bool) {
        return _breachedContract;
    }
}
