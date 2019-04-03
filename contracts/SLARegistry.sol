pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./SLA/SLA.sol";

contract SLARegistry {

    using SafeMath for uint256;

    mapping(address => uint[]) private userToSLAIndexes;

    SLA[] public SLAs;

    event SLARegistered(SLA indexed sla);

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

        emit SLARegistered(sla);

        _dsla.transferFrom(msg.sender, address(sla), _poolSize);
        uint index = SLAs.push(sla);

        userToSLAIndexes[msg.sender].push(index);
    }

    function userSLAs(address _user) public view returns(SLA[] memory) {
        uint count = userSLACount(_user);
        SLA[] memory SLAList = new SLA[](count);
        uint[] memory userSLAIndexes = userToSLAIndexes[_user];

        for(uint i = 0; i < count; i++) {
            SLAList[i] = (SLAs[userSLAIndexes[i]]);
        }

        return(SLAList);
    }

    function userSLACount(address _user) public view returns(uint) {
        return userToSLAIndexes[_user].length;
    }

    function allSLAs() public view returns(SLA[] memory) {
        return(SLAs);
    }

    function SLACount() public view returns(uint) {
        return SLAs.length;
    }

    function paginatedSLAs(uint _start, uint _end) public view returns(SLA[] memory) {
        require(_start >= _end);

        SLA[] memory SLAList = new SLA[](_end.sub(_start).add(1));

        for(uint i = 0; i < _end.sub(_start).add(1); i++) {
            SLAList[i] = (SLAs[i.add(_start)]);
        }

        return(SLAList);
    }
}
