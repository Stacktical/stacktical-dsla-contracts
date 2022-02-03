# dsla-protocol-contracts

DSLA Protocol is a risk management framework that enables developers and infrastructure operators to reduce their users exposure to service delays, interruptions and financial losses, using self-executing service level agreements, bonus-malus insurance policies, and crowdfunded liquidity pools.

# Usage

Import the contracts on your Solidity code like:
```
import "@stacktical/dsla-protocol/contracts/NAME_OF_CONTRACT"
```

Or if you want to create a Messenger, you have to import the IMessenger.sol abstract:
```
import "@stacktical/dsla-protocol/contracts/interfaces/IMessenger.sol"
```

Currently on version 0.6.6 of Solidity.

## DSLA Protocol Smart Contracts
## Contracts description
* SLORegistry: Contract to register SLAs SLO value and type
* SLARegistry: Contract to deploy SLAs and request SLIs
* MessengerRegistry: Contract to register new messengers
* PeriodRegistry: Contract to register new periods
* StakeRegistry: Contract to register stakes
* Details: Contract to get details of multiple contracts

## Audits

* Certik [Report](https://www.certik.org/projects/stacktical)
* Chainsulting [Report](https://github.com/chainsulting/Smart-Contract-Security-Audits/blob/master/Stacktical/02_Smart%20Contract%20Audit_Stacktical_DSLA_Protocol.pdf)
* @lucash-dev [Report](https://storage.googleapis.com/stacktical-public/audits/audit1v2.pdf)

**Note:**

* Regarding Certik's SCK-03 in [Staking.sol](contracts/Staking.sol)

As Staking.sol contract is going to call contracts defined by Stacktical we consider the implementation of Reentrancy Guard as unnecessary, since we fully control the external calls.
Those external calls correspond to ERC-20 contracts with is a fully reviewed and battle tested standard.
In future versions, when the token selection will be opened, we can implement a full Reentrancy Guard protection.

## Tests

### Unit tests

`hh test`

## Disclaimer

Revert messages for SLARegistry, SLA and Staking contracts were shortened at commit [459ef4f587df48645dcac886d49763ad3e8ab5c3](https://github.com/Stacktical/dsla-protocol-contracts/commit/459ef4f587df48645dcac886d49763ad3e8ab5c3) because of constants "contract too large" problems.
The business logic remains the same as mainnet deployment.
