pragma solidity 0.5.7;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./SLA/SLA.sol";

/**
 * @title SLARegistry
 * @dev SLARegistry is a contract for handling creation of service level
 * agreements and keeping track of the created agreements
 */
contract SLARegistry {

    using SafeMath for uint256;

    // Array that stores the addresses of created service level agreements
    SLA[] public SLAs;

    // Mapping that stores the indexes of service level agreements owned by a user
    mapping(address => uint[]) private userToSLAIndexes;

    /**
     * @dev event for service level agreement creation logging
     * @param sla The address of the created service level agreement contract
     * @param owner The address of the owner of the service level agreement
     */
    event SLACreated(SLA indexed sla, address indexed owner);

    /**
     * @dev public function for creating service level agreements
     * @param _owner Address of the owner of the service level agreement
     * @param _whitelist Address of the whitelist contract
     * @param _dsla Address of the DSLA token contract
     * @param _SLONames Array of the names of the service level objectives
     * in bytes32
     * @param _SLOs Array of service level objective contract addressess
     * @param _compensationAmount Uint of the amount of DSLA to compensate on
     * service level objective breach
     * @param _stake Uint of the amount required to stake when signing the
     * service level agreement
     * @param _ipfsHash String with the ipfs hash that contains extra
     * information about the service level agreement
     */
    function createSLA(
        address _owner,
        Whitelist _whitelist,
        IERC20 _dsla,
        bytes32[] memory _SLONames,
        SLO[] memory _SLOs,
        uint _compensationAmount,
        uint _stake,
        string memory _ipfsHash,
        uint _poolSize
    ) public {
        require(_dsla.allowance(msg.sender, address(this)) >= _poolSize);

        SLA sla = new SLA(
            _owner,
            _whitelist,
            _dsla,
            _SLONames,
            _SLOs,
            _compensationAmount,
            _stake,
            _ipfsHash
        );

        _dsla.transferFrom(msg.sender, address(sla), _poolSize);

        uint index = SLAs.push(sla).sub(1);

        userToSLAIndexes[msg.sender].push(index);

        emit SLACreated(sla, _owner);
    }

    /**
     * @dev public view function that returns the service level agreements that
     * the given user is the owner of
     * @param _user Address of the user for which to return the service level
     * agreements
     */
    function userSLAs(address _user) public view returns(SLA[] memory) {
        uint count = userSLACount(_user);
        SLA[] memory SLAList = new SLA[](count);
        uint[] memory userSLAIndexes = userToSLAIndexes[_user];

        for(uint i = 0; i < count; i++) {
            SLAList[i] = (SLAs[userSLAIndexes[i]]);
        }

        return(SLAList);
    }

    /**
     * @dev public view function that returns the amount of service level
     * agreements the given user is the owner of
     * @param _user Address of the user for which to return the amount of
     * service level agreements
     */
    function userSLACount(address _user) public view returns(uint) {
        return userToSLAIndexes[_user].length;
    }

    /**
     * @dev public view function that returns all the service level agreements
     */
    function allSLAs() public view returns(SLA[] memory) {
        return(SLAs);
    }

    /**
     * @dev public view function that returns the total amount of service
     * level agreements
     */
    function SLACount() public view returns(uint) {
        return SLAs.length;
    }

    /**
     * @dev external view function that returns the service level agreements for
     * a certain range in the array
     * @param _start the index of the start position in the array
     * @param _end the index of the end position in the array
     */
    function paginatedSLAs(uint _start, uint _end) external view returns(SLA[] memory) {
        require(_start >= _end);

        SLA[] memory SLAList = new SLA[](_end.sub(_start).add(1));

        for(uint i = 0; i < _end.sub(_start).add(1); i++) {
            SLAList[i] = (SLAs[i.add(_start)]);
        }

        return(SLAList);
    }
}
