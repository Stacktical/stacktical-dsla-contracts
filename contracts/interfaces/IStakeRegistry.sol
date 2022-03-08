// SPDX-License-Identifier: MIT
pragma solidity 0.6.6;
import '@openzeppelin/contracts/access/Ownable.sol';

abstract contract IStakeRegistry is Ownable {
    function registerStakedSla(address _owner) external virtual returns (bool);

    function setSLARegistry() external virtual;

    function lockDSLAValue(
        address slaOwner_,
        address sla_,
        uint256 periodIdsLength_
    ) external virtual;

    function getStakingParameters()
        external
        virtual
        view
        returns (
            uint256 DSLAburnRate,
            uint256 dslaDepositByPeriod,
            uint256 dslaPlatformReward,
            uint256 dslaMessengerReward,
            uint256 dslaUserReward,
            uint256 dslaBurnedByVerification,
            uint256 maxTokenLength,
            uint64 maxLeverage,
            bool burnDSLA
        );

    function DSLATokenAddress() external virtual view returns (address);

    function isAllowedToken(address tokenAddress_) external virtual view returns (bool);

    function returnLockedValue(address sla_) external virtual;

    function distributeVerificationRewards(
        address _sla,
        address _verificationRewardReceiver,
        uint256 _periodId
    ) external virtual;

    function createDToken(string calldata _name, string calldata _symbol, uint8 decimals)
        external
        virtual
        returns (address);
}
