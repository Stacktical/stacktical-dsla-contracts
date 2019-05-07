pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Compensatable.sol";
import "./Subscribable.sol";
import "../Whitelist/Whitelist.sol";
import "../SLO/SLO.sol";

/**
 * @title SLA
 * @dev SLA is a service level agreement contract used for service downtime
 * compensation
 */
contract SLA is Ownable, Compensatable, Subscribable {

    using SafeMath for uint256;

    // The ERC20 contract address used for compensations and staking
    IERC20 public dsla;

    // The required amount to stake when subscribing to the agreement
    uint public stake;

    // The ipfs hash that stores extra information about the agreement
    string ipfsHash;

    // Struct used for storing registered SLI's
    struct SLI {
        uint timestamp;
        uint value;
        string ipfsHash;
    }

    // Mapping to get SLO addresses from SLO names in bytes32
    mapping(bytes32 => SLO) public SLOs;

    // Mapping to get SLI structs from SLO names in bytes32
    mapping(bytes32 => SLI[]) public SLIs;

    // Array storing the names of the SLO's of this agreement
    bytes32[] SLONames;

    /**
     * @dev event for SLI creation logging
     * @param _timestamp the time the SLI has been registered
     * @param _value the value of the SLI
     * @param _hash the ipfs hash that stores additional info
     */
    event SLICreated(uint _timestamp, uint _value, string _hash);

    /**
     * @dev constructor
     * @param _owner the owner of the service level agreement
     * @param _whitelist the address of the whitelist used for allowing users to
     * sign the agreement
     * @param _dsla the address of the ERC20 contract used for compensations and
     * staking
     * @param _SLONames the names of the service level objectives in a bytes32
     * array
     * @param _SLOs an array with the service level objective addresses
     * @param _compensationAmount the amount of ERC20 tokens that is distributed
     * on a breach
     * @param _stake the amount required to stake when subscribing to the
     * agreement
     * @param _ipfsHash the ipfs hash that stores extra information about the
     * agreement
     */
    constructor(
        address _owner,
        Whitelist _whitelist,
        IERC20 _dsla,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint _compensationAmount,
        uint _stake,
        string memory _ipfsHash
    )
    public {
        require(_SLOs.length < 5);
        require(_SLONames.length == _SLOs.length);

        for(uint i = 0; i < _SLOs.length; i++) {
            SLOs[_SLONames[i]] = _SLOs[i];
        }

        transferOwnership(_owner);
        SLONames = _SLONames;
        whitelist = _whitelist;
        dsla = _dsla;
        compensationAmount = _compensationAmount;
        stake = _stake;
        ipfsHash = _ipfsHash;
    }

    /**
     * @dev external function to register SLI's and check them against the SLO's
     * @param _SLOName the name of the SLO in bytes32
     * @param _value the value of the SLI to check
     * @param _hash the ipfs hash with additional information
     */
    function registerSLI(bytes32 _SLOName, uint _value, string calldata _hash)
        external
        onlyOwner
    {
        SLIs[_SLOName].push(SLI(now, _value, _hash));

        emit SLICreated(now, _value, _hash);

        if(!SLOs[_SLOName].isSLOHonored(_value)) {
            _compensate();
        }
    }

    /**
     * @dev external function to change the whitelist address
     * @param _newWhitelist the address of the new whitelist contract
     */
    function changeWhitelist(Whitelist _newWhitelist) external onlyOwner {
        whitelist = _newWhitelist;
    }

    /**
     * @dev external function to sign the agreement
     */
    function signAgreement() external onlyWhitelisted onlyNotSubscribed{
        _subscribe();
        _setInitialuserCompensation();

        if (stake > 0) {
            dsla.approve(address(this), stake);
            dsla.transferFrom(msg.sender, address(this), stake);
        }
    }

    /**
     * @dev external function to withdraw the entitled compensation from the
     * contract
     */
    function withdrawCompensation() external onlySubscribed {
        uint withdrawalAmount = _withdrawCompensation(msg.sender);
        dsla.transfer(msg.sender, withdrawalAmount);
    }

    /**
     * @dev external function to withdraw entitled compensations for an array
     * of addresses
     * @param _users the array of user addresses to withdraw compensations for
     */
    function withdrawCompensations(address[] calldata _users) external {
        uint reward = 0;

        for(uint i = 0; i < _users.length; i++) {
            address userAddress = _users[i];

            if (isSubscribed(userAddress) && _compensationWithdrawable(userAddress)) {
                uint withdrawalAmount = _withdrawCompensation(userAddress);
                dsla.transfer(userAddress, withdrawalAmount);

                reward = reward.add(1e18);
            }
        }

        // TODO: Replace temporary reward calculation with actual calculation
        dsla.transfer(msg.sender, reward);
    }

    /**
     * @dev external function to revoke the agreement
     */
    function revokeAgreement() external onlySubscribed {
        if (_compensationWithdrawable(msg.sender)) {
            _withdrawCompensation(msg.sender);
        }

        _unSubscribe();

        if (stake > 0) {
            dsla.transfer(msg.sender, stake);
        }
    }

    /**
     * @dev external view function that returns all agreement information
     */
    function getDetails() external view returns(
        string memory,
        IERC20,
        Whitelist,
        address,
        uint,
        uint,
        uint,
        bytes32[] memory,
        SLO[] memory
    ){
        SLO[] memory _SLOAddressess = new SLO[](SLONames.length);

        for(uint i = 0; i < SLONames.length; i++) {
            _SLOAddressess[i] = SLOs[SLONames[i]];
        }

        return(
            ipfsHash,
            dsla,
            whitelist,
            owner(),
            compensationAmount,
            stake,
            subscribersCount,
            SLONames,
            _SLOAddressess
        );
    }

    /**
     * @dev external view function that returns all subscribers that are
     * entitled to a compensation
     */
    function getWithdrawableSubscribers() external view returns(address[] memory) {
        address[] memory userList = new address[](usersCount);

        for(uint i = 0; i < usersCount; i++) {
            address userAddress = allUsers[i];

            if (isSubscribed(userAddress) && _compensationWithdrawable(userAddress)) {
                userList[i] = userAddress;
            } else {
                userList[i] = address(0);
            }
        }

        return userList;
    }
}
