// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SLO.sol";
import "./SLARegistry.sol";
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
    struct SLAPeriod {
        uint256 timestamp;
        uint256 sli;
        Status status;
    }

    struct TokenStake {
        address tokenAddress;
        uint256 stake;
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

    /// @dev periodId=>SLAPeriod mapping
    mapping(uint256 => SLAPeriod) public slaPeriods;

    /// @dev block number of SLA deployment
    uint256 public creationBlockNumber;

    /// @dev extra data for customized workflows
    bytes32 public extraData;

    /// @dev states if the contract was breached or not
    bool private _breachedContract = false;

    /**
     * @dev event for SLI creation logging
     * @param _timestamp 1. the time the SLI has been registered
     * @param _sli 2. the value of the SLI
     * @param _periodId 3. the id of the given period
     */
    event SLICreated(uint256 _timestamp, uint256 _sli, uint256 _periodId);

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
     * @param _extraData 9. boolean to declare whitelisted contracts
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
        bytes32 _extraData
    )
        public
        Staking(
            _stakeRegistry,
            _periodRegistry,
            _periodType,
            _periodIds.length,
            _whitelisted
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
        SLAPeriod storage slaPeriod = slaPeriods[_periodId];
        slaPeriod.sli = _sli;
        slaPeriod.timestamp = block.timestamp;
        uint256 sloValue = slo.value();
        if (slo.isSLOHonored(_sli)) {
            slaPeriod.status = Status.Respected;
            _setRespectedPeriodReward(_periodId, _sli.sub(sloValue));
        } else {
            slaPeriod.status = Status.NotRespected;
            _setUsersCompensationPool();
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
        slaRegistry.registerStakedSla(msg.sender);
    }

    /**
     *@dev withdraw _amount tokens from the _token contract
     *@param _amount 1. amount to be staked
     *@param _tokenAddress 2. address of the ERC to be staked
     */

    function withdrawStakedTokens(uint256 _amount, address _tokenAddress)
        public
    {
        require(_amount > 0, "amount cannot be 0");
        uint256 lastValidPeriodId = periodIds[periodIds.length - 1];
        (, uint256 endOfLastValidPeriod) =
            periodRegistry.getPeriodStartAndEnd(periodType, lastValidPeriodId);
        // providers and users can withdraw only if the contract is breached
        // or if the last period is finished and the period status was verified
        require(
            _breachedContract == true ||
                (block.timestamp >= endOfLastValidPeriod &&
                    slaPeriods[lastValidPeriodId].status != Status.NotVerified),
            "Can only withdraw stake after the final period is finished or if the contract is breached"
        );
        _withdraw(_amount, _tokenAddress);
    }

    /**
     *@dev withdraw provider reward of a given token address
     *@param _tokenAddress 1. address of the token to withdraw rewards
     */

    function claimUserCompensation(address _tokenAddress) public {
        _claimCompensation(_tokenAddress);
    }

    /**
     * @dev external view function that returns all agreement information
     * @return _slaOwner 1. address  owner
     * @return _ipfsHash 2. string  ipfsHash
     * @return _SLO 3. addresses of the SLO
     * @return _SLAPeriods 5. SLAPeriod[]
     * @return _stakersCount 6. amount of stakers
     * @return _tokensStake 7. SLAPeriod[]  addresses array
     */

    function getDetails()
        external
        view
        returns (
            address _slaOwner,
            string memory _ipfsHash,
            SLO _SLO,
            SLAPeriod[] memory _SLAPeriods,
            uint256 _stakersCount,
            TokenStake[] memory _tokensStake
        )
    {
        _slaOwner = owner();
        _ipfsHash = ipfsHash;
        _SLO = slo;
        _SLAPeriods = new SLAPeriod[](periodIds.length);
        for (uint256 index = 0; index < periodIds.length; index++) {
            uint256 periodId = periodIds[index];
            SLAPeriod memory slaPeriod = slaPeriods[periodId];
            _SLAPeriods[index] = SLAPeriod({
                status: slaPeriod.status,
                sli: slaPeriod.sli,
                timestamp: slaPeriod.timestamp
            });
        }
        _stakersCount = stakers.length;
        _tokensStake = new TokenStake[](allowedTokens.length);
        for (uint256 index = 0; index < allowedTokens.length; index++) {
            _tokensStake[index] = TokenStake({
                tokenAddress: allowedTokens[index],
                stake: tokenPools[allowedTokens[index]]
            });
        }
    }

    function breachedContract() public view returns (bool) {
        return _breachedContract;
    }
}
