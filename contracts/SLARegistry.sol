// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "./Messenger.sol";
import "./SLA/SLA.sol";
import "./SLO/SLO.sol";
import "./SLA/Staking.sol";

/**
 * @title SLARegistry
 * @dev SLARegistry is a contract for handling creation of service level
 * agreements and keeping track of the created agreements
 */
contract SLARegistry {
    using SafeMath for uint256;
    bytes4 private constant NAME_SELECTOR = bytes4(keccak256(bytes("name()")));

    /// @dev struct to return on getActivePool function.
    struct ActivePool {
        address SLAaddress;
        uint256 stake;
        string assetName;
        address assetAddress;
    }

    /// @dev Messenger of the SLA Registry
    Messenger public messenger;

    /// @dev stores the addresses of created SLAs
    SLA[] public SLAs;

    /// @dev mapping SLA=>bool to check if SLA is registered
    mapping(address => bool) public registeredSLAs;

    /// @dev stores the indexes of service level agreements owned by an user
    mapping(address => uint256[]) private userToSLAIndexes;

    /// @dev mapping userAddress => SLA[]
    mapping(address => SLA[]) public userStakedSlas;

    modifier onlyRegisteredSla {
        require(registeredSLAs[msg.sender] == true, "Only for registered SLAs");
        _;
    }

    /**
     * @dev event for service level agreement creation logging
     * @param sla 1. The address of the created service level agreement contract
     * @param owner 2. The address of the owner of the service level agreement
     */
    event SLACreated(SLA indexed sla, address indexed owner);

    /**
     * @dev constructor
     * @param _messengerAddress the address of the chainlink messenger contract
     */
    constructor(Messenger _messengerAddress) public {
        messenger = _messengerAddress;
        messenger.setSLARegistry();
    }

    /**
     * @dev public function for creating service level agreements
     * @param _owner 1. address of the owner of the service level agreement
     * @param _SLONames 2. array of the names of the service level objectives
     * in bytes32
     * @param _SLOs 3. array of service level objective contract addressess
     * service level objective breach
     * @param _stake 4. uint of the amount required to stake when signing the
     * service level agreement
     * @param _ipfsHash 5. string with the ipfs hash that contains extra
     * information about the service level agreement
     * @param _sliInterval 6. uint the interval in seconds between requesting a new SLI
     * @param _baseTokenAddress 7. address of the base token
     * @param _sla_period_starts 8. array with the values for the "start" of every period
     * @param _sla_period_ends 9. array with the values for the "end" of every period
     */
    function createSLA(
        address _owner,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint256 _stake,
        string memory _ipfsHash,
        uint256 _sliInterval,
        address _baseTokenAddress,
        uint256[] memory _sla_period_starts,
        uint256[] memory _sla_period_ends
    ) public {
        SLA sla =
            new SLA(
                _owner,
                _SLONames,
                _SLOs,
                _stake,
                _ipfsHash,
                _sliInterval,
                _baseTokenAddress,
                _sla_period_starts,
                _sla_period_ends
            );

        SLAs.push(sla);
        registeredSLAs[address(sla)] = true;
        uint256 index = SLAs.length.sub(1);

        userToSLAIndexes[msg.sender].push(index);

        emit SLACreated(sla, _owner);
    }

    /**
     * @dev Gets SLI information for the specified SLA and SLO
     * @param _periodId 1. id of the period
     * @param _sla 2. SLA Address
     * @param _sloName 3. SLO Name
     * @notice it will revert if the SLO is not registered in the SLA
     */
    function requestSLI(
        uint256 _periodId,
        SLA _sla,
        bytes32 _sloName
    ) public {
        require(
            address(SLA(_sla).SLOs(_sloName)) != address(0),
            "_sloName does not exist in the SLA contract"
        );
        (
            uint256 sla_period_start,
            uint256 sla_period_end,
            ,
            ,
            Staking.Status status,
            ,

        ) = _sla.periods(_periodId);
        require(
            status == Staking.Status.NotVerified,
            "SLA contract was already verified for the period"
        );
        require(
            sla_period_end < block.timestamp,
            "SLA contract period has not finished yet"
        );
        messenger.requestSLI(_periodId, _sla, _sloName);
    }

    /**
     * @dev public view function that returns the service level agreements that
     * the given user is the owner of
     * @param _user Address of the user for which to return the service level
     * agreements
     * @return array of SLAs
     */
    function userSLAs(address _user) public view returns (SLA[] memory) {
        uint256 count = userSLACount(_user);
        SLA[] memory SLAList = new SLA[](count);
        uint256[] memory userSLAIndexes = userToSLAIndexes[_user];

        for (uint256 i = 0; i < count; i++) {
            SLAList[i] = (SLAs[userSLAIndexes[i]]);
        }

        return (SLAList);
    }

    /**
     * @dev public view function that returns the amount of service level
     * agreements the given user is the owner of
     * @param _user 1. address of the user for which to return the amount of
     * service level agreements
     * @return uint256 corresponding to the amount of user's SLAs
     */
    function userSLACount(address _user) public view returns (uint256) {
        return userToSLAIndexes[_user].length;
    }

    /**
     * @dev public view function that returns all the service level agreements
     * @return SLA[] array of SLAs
     */
    function allSLAs() public view returns (SLA[] memory) {
        return (SLAs);
    }

    /**
     * @dev public view function that returns the total amount of service
     * level agreements
     * @return uint256, the length of SLA array
     */
    function SLACount() public view returns (uint256) {
        return SLAs.length;
    }

    /**
     *@dev public view function that returns true if the _owner has staked on _sla
     *@param _user 1. address to check
     *@param _sla 2. sla to check
     *@return bool, true if _sla was staked by _user
     */
    function slaWasStakedByUser(address _user, address _sla)
        public
        view
        returns (bool)
    {
        for (uint256 index = 0; index < userStakedSlas[_user].length; index++) {
            if (address(userStakedSlas[_user][index]) == _sla) {
                return true;
            }
        }
        return false;
    }

    /**
     *@dev register the sending SLA contract as staked by _owner
     *@param _owner 1. SLA contract to stake
     */
    function registerStakedSla(address _owner)
        public
        onlyRegisteredSla
        returns (bool)
    {
        if (slaWasStakedByUser(_owner, msg.sender) == false) {
            userStakedSlas[_owner].push(SLA(msg.sender));
        }
        return true;
    }

    /**
     * @dev returns the active pools owned by a user.
     * @param _slaOwner 1. owner of the active pool
     * @return ActivePool[], array of structs: {SLAaddress,stake,assetName}
     */
    function getActivePool(address _slaOwner)
        public
        view
        returns (ActivePool[] memory)
    {
        uint256 stakeCounter = 0;
        // Count the stakes of the user, checking every SLA staked
        for (
            uint256 index = 0;
            index < userStakedSlas[_slaOwner].length;
            index++
        ) {
            SLA currentSLA = SLA(userStakedSlas[_slaOwner][index]);
            stakeCounter = stakeCounter.add(
                currentSLA.getTokenStakeLength(_slaOwner)
            );
        }

        ActivePool[] memory activePools = new ActivePool[](stakeCounter);
        // to insert on activePools array
        uint256 stakePosition = 0;
        for (
            uint256 index = 0;
            index < userStakedSlas[_slaOwner].length;
            index++
        ) {
            SLA currentSLA = userStakedSlas[_slaOwner][index];
            for (
                uint256 tokenIndex = 0;
                tokenIndex < currentSLA.getTokenStakeLength(_slaOwner);
                tokenIndex++
            ) {
                (address tokenAddress, uint256 stake) =
                    currentSLA.getTokenStake(_slaOwner, tokenIndex);
                (, bytes memory tokenNameBytes) =
                    tokenAddress.staticcall(
                        abi.encodeWithSelector(NAME_SELECTOR)
                    );
                ActivePool memory currentActivePool =
                    ActivePool({
                        SLAaddress: address(currentSLA),
                        stake: stake,
                        assetName: string(tokenNameBytes),
                        assetAddress: tokenAddress
                    });
                activePools[stakePosition] = currentActivePool;
                stakePosition = stakePosition.add(1);
            }
        }
        return activePools;
    }
}
