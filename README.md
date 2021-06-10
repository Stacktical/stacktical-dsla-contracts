# stacktical-dsla-contracts

DSLA Protocol is a risk management framework that enables developers and infrastructure operators to reduce their users exposure to service delays, interruptions and financial losses, using self-executing service level agreements, bonus-malus insurance policies, and crowdfunded liquidity pools.


## DSLA Protocol Smart Contracts

### Getting Started

#### Requirements

```
* node
* Truffle `5.2.5`
* Ganache
```

#### Local deployment
```
npm i
ganache-cli -h 0.0.0.0
npm run deploy:develop
```

#### Run tests

```
npm run test:develop
```

### Code styling

**Linter**

`solium -d contracts`

**Other styling**

[Style guide](https://solidity.readthedocs.io/en/latest/style-guide.html)

**Commenting**

[Natspec](https://github.com/ethereum/wiki/wiki/Ethereum-Natural-Specification-Format)


## Contracts description
* SLORegistry: Contract to register SLAs SLO value and type
* SLARegistry: Contract to deploy SLAs and request SLIs
* AdminWallet: Owner wallet
* MessengerRegistry: Contract to register new messengers
* PeriodRegistry: Contract to register new periods
* StakeRegistry: Contract to register stakes
* SEMessenger: Staking efficiency messenger
* NetworkAnalytics: Contract to request analytics objects
* Details: Contract to get details of multiple contracts
* DSLAToken: DSLA token address
* DAIToken: DAI token address
* USDCToken: USDC token address


### Documentation
NATSpec userdoc and devdoc JSON files are included in natspec-docs directory. Use it to check the inputs of the functions, or events parameters.


## Mainnet Deployment

[Reference](./exported-data/networks/mainnet.ts)

``` 
DSLAToken: '0x3aFfCCa64c2A6f4e3B6Bd9c64CD2C969EFd1ECBe',
DAIToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
USDCToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
SLORegistry: '0x1bE60A36Ba9De2eCeFe8be8d2720B67f932EC487',
SLARegistry: '0xB63a13825e129fBa2f2205847158461bec5f265A',
MessengerRegistry: '0x766C0b52fADC43Bc3EEAe8BC64536404981951bE',
PeriodRegistry: '0x5Da279bE9D6CeB11e7D7117915075066909357bc',
StakeRegistry: '0x4b48AdDd838A11061cE285106f4a30cc5636735C',
SEMessenger: '0xFB29aFC3F4B78755f07faD5B86448595D2EEC86C',
NetworkAnalytics: '0xC33492F8D76918A9527165A9fD71089980656357',
Details: '0x38b0cd8BB4C4608E32EE75b25A8846459cEAd513',
```

## Security

### Bug Bounty

This repository is subject to the DSLA Bug bounty program [here](https://immunefi.com/bounty/dslaprotocol/).

### Audits

 * Certik [Report](https://www.certik.org/projects/stacktical)
 * Chainsulting [Report](https://github.com/chainsulting/Smart-Contract-Security-Audits/blob/master/Stacktical/02_Smart%20Contract%20Audit_Stacktical_DSLA_Protocol.pdf)
 * @lucash-dev [Report](https://storage.googleapis.com/stacktical-public/audits/audit1v2.pdf)

**Note:**

* Regarding Certik's SCK-03 in [Staking.sol](./contracts/Staking.sol)

As Staking.sol contract is going to call contracts defined by Stacktical we consider the implementation of Reentrancy Guard as unnecessary, since we fully control the external calls.
Those external calls correspond to ERC-20 contracts with is a fully reviewed and battle tested standard.
In future versions, when the token selection will be opened, we can implement a full Reentrancy Guard protection.