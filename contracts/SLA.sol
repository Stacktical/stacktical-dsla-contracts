// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./SLO.sol";
import "./SLARegistry.sol";
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
        uint256 reward;
        uint256 compensation;
        bool claimed;
    }

    struct TokenStake {
        address tokenAddress;
        uint256 stake;
    }

    /// @dev address of the SLO
    SLO public slo;

    /// @dev The ipfs hash that stores extra information about the agreement
    string public ipfsHash;

    /// @dev array of he allowed canonical period ids
    uint256[] public canonicalPeriodIds;

    /// @dev The address of the slaRegistry contract
    SLARegistry public slaRegistry;

    /// @dev periodId=>SLAPeriod mapping
    mapping(uint256 => SLAPeriod) public slaPeriods;

    /// @dev block number of SLA deployment
    uint256 public creationBlockNumber;

    /**
     * @dev event for SLI creation logging
     * @param _timestamp 1. the time the SLI has been registered
     * @param _value 2. the value of the SLI
     * @param _periodId 3. the id of the given period
     */
    event SLICreated(uint256 _timestamp, uint256 _value, uint256 _periodId);

    /**
     * @dev throws if called by any address other than the messenger contract.
     */
    modifier onlyMessenger() {
        require(
            msg.sender == address(slaRegistry.messenger()),
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
     * @param _dslaTokenAddress 4. DSLA token address
     * @param _canonicalPeriodIds 5. id of the allowed canonical periods
     */
    constructor(
        address _owner,
        SLO _SLO,
        string memory _ipfsHash,
        address _dslaTokenAddress,
        uint256[] memory _canonicalPeriodIds
    ) public Staking(_dslaTokenAddress) {
        for (
            uint256 index = 0;
            index < _canonicalPeriodIds.length - 1;
            index++
        ) {
            require(
                _canonicalPeriodIds[index] < _canonicalPeriodIds[index + 1],
                "Period ids array should be sorted"
            );
        }
        transferOwnership(_owner);
        ipfsHash = _ipfsHash;
        slaRegistry = SLARegistry(msg.sender);
        creationBlockNumber = block.number;
        canonicalPeriodIds = _canonicalPeriodIds;
        slo = _SLO;
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
        if (slo.isSLOHonored(_sli)) {
            slaPeriod.status = Status.Respected;
        } else {
            slaPeriod.status = Status.NotRespected;
        }
    }

    function _isAllowedPeriod(uint256 _periodId) internal view returns (bool) {
        for (uint256 index = 0; index < canonicalPeriodIds.length; index++) {
            if (canonicalPeriodIds[index] == _periodId) return true;
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
        _stake(_amount, _token);
        slaRegistry.registerStakedSla(msg.sender);
    }

    /**
     *@dev withdraw _amount tokens from the _token contract
     *@param _amount 1. amount to be staked
     *@param _token 2. address of the ERC to be staked
     */

    function withdrawStake(uint256 _amount, address _token) public {
        require(_amount > 0, "amount cannot be 0");
        if (msg.sender != owner()) {
            (, uint256 endOfLastValidPeriod) =
                slaRegistry.canonicalPeriods(
                    canonicalPeriodIds[canonicalPeriodIds.length - 1]
                );
            require(
                block.timestamp >= endOfLastValidPeriod,
                "Can only withdraw stake after the final period is finished"
            );
        }
        _withdraw(_amount, _token);
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
        _SLAPeriods = new SLAPeriod[](canonicalPeriodIds.length);
        for (uint256 index = 0; index < canonicalPeriodIds.length; index++) {
            uint256 periodId = canonicalPeriodIds[index];
            SLAPeriod memory slaPeriod = slaPeriods[periodId];
            _SLAPeriods[index] = SLAPeriod({
                reward: slaPeriod.reward,
                compensation: slaPeriod.compensation,
                claimed: slaPeriod.claimed,
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
                stake: tokenStake[allowedTokens[index]]
            });
        }
    }
}
