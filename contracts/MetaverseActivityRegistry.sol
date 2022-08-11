// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import '@openzeppelin/contracts/access/Ownable.sol';

import './interfaces/IMetaverseActivityRegistry.sol';

contract MetaverseActivityRegistry is IMetaverseActivityRegistry, Ownable {
    /// @dev Address to DSLAActivityRegistry of DSLA Metaverse Protocol
    address public metaverseRegistry;
    /// @dev List of registrants granted permission to register activities
    mapping(address => bool) public registrants;

    modifier onlyRegistrant() {
        require(registrants[msg.sender], 'Caller is not registrant');
        _;
    }

    constructor(address _metaverseRegistry) {
        metaverseRegistry = _metaverseRegistry;
    }

    function addRegistrant(address[] memory accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            registrants[accounts[i]] = true;
        }
    }

    function removeRegistrant(address[] memory accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            registrants[accounts[i]] = false;
        }
    }

    function registerActivity(address user, SkillType activityType)
        external
        onlyRegistrant
    {
        IMetaverseActivityRegistry(metaverseRegistry).registerActivity(
            user,
            activityType
        );
    }
}
