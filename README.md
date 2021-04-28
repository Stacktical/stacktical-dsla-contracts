# stacktical-dsla-contracts

DSLA Protocol is a risk management framework that enables developers and infrastructure operators to reduce their users exposure to service delays, interruptions and financial losses, using self-executing service level agreements, bonus-malus insurance policies, and crowdfunded liquidity pools.


## DSLA Protocol Smart Contracts

### Getting Started

#### Requirements

* node
* Truffle `5.1.64`
* Ganache

#### Local deployment
```
npm i
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
    DSLAToken: '0x3affcca64c2a6f4e3b6bd9c64cd2c969efd1ecbe'
    SLORegistry: '0x33065a04993BeEd06C2415349DbF976B941e80D1'
    SLARegistry: '0xEF12BDcF5E5D5ae4c950a9FaEb2A274d1646b48D'
    AdminWallet: '0xF97Cf29fb0814a83e88DdF324D32bda45706Fb42'
    DAIToken: '0x6b175474e89094c44da98b954eedeac495271d0f'
    USDCToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    MessengerRegistry: '0x857533E7d9DE216E8BdBd1620018099B88cDD792'
    PeriodRegistry: '0x7229e7cb280cb55741B13485ded35C1df3790BC0'
    StakeRegistry: '0x143c0e6cB35AC53C7f06d4914199E4cAc3977AC7'
    SEMessenger: '0x674c6ee7cAdDc782b54fE53B89C4d4F6f2722644'
    NetworkAnalytics: '0xf41EaA49BBae8650f051100d4385d5d7F9af4a54'
    Details: '0x9986B2ec991D58954A3AE6f3Ab754FFE2EDE21a4'
```

## Audits

 * Certik [Report](https://www.certik.org/projects/stacktical)
 * Chainsulting [Report](https://github.com/chainsulting/Smart-Contract-Security-Audits/blob/master/Stacktical/02_Smart%20Contract%20Audit_Stacktical_DSLA_Protocol.pdf)
 * @lucash-dev [Report](https://storage.googleapis.com/stacktical-public/audits/audit1v2.pdf)

**Note:**

* Regarding Certik's SCK-03 in [Staking.sol](./contracts/Staking.sol)

As Staking.sol contract is going to call contracts defined by Stacktical we consider the implementation of Reentrancy Guard as unnecessary, since we fully control the external calls.
Those external calls correspond to ERC-20 contracts with is a fully reviewed and battle tested standard.
In future versions, when the token selection will be opened, we can implement a full Reentrancy Guard protection.