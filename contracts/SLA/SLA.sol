pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "./Compensatable.sol";
import "./Subscribable.sol";
import "../Whitelist/Whitelist.sol";
import "../SLO/SLO.sol";

contract SLA is Ownable, Compensatable, Subscribable {

    IERC20 public dsla;

    uint public stake;
    string ipfsHash;

    struct SLI {
        uint timestamp;
        uint value;
        string ipfsHash;
    }

    mapping(bytes32 => SLO) public SLOs;
    mapping(bytes32 => SLI[]) public SLIs;

    event SLICreated(uint _timestamp, uint _value, string _hash);

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
        whitelist = _whitelist;
        dsla = _dsla;
        compensationAmount = _compensationAmount;
        stake = _stake;
        ipfsHash = _ipfsHash;
    }

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

    function changeWhitelist(Whitelist _newWhitelist) external onlyOwner {
        whitelist = _newWhitelist;
    }

    function signAgreement() external {
        _subscribe();
        _setInitialuserCompensation();

        if (stake > 0) {
          dsla.approve(address(this), stake);
          dsla.transferFrom(msg.sender, address(this), stake);
        }
    }

    function withdrawCompensation() external onlySubscribed {
        _withdrawCompensation();
    }

    function revokeAgreement() external onlySubscribed {
        _unSubscribe();

        if (stake > 0) {
          dsla.transfer(msg.sender, stake);
        }
    }

    function getInformation() external view returns(
        IERC20,
        Whitelist,
        address,
        uint,
        uint,
        uint
    ){
        return(
            dsla,
            whitelist,
            owner(),
            compensationAmount,
            stake,
            subscribersCount
        );
    }
}
