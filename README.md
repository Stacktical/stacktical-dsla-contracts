# stacktical-dsla-contracts

## Dev

### Versions

Truffle `5.0.10`

### Code styling

**Linter**

`solium -d contracts`

**Other styling**

[Style guide](https://solidity.readthedocs.io/en/latest/style-guide.html)

**Commenting**

[Natspec](https://github.com/ethereum/wiki/wiki/Ethereum-Natural-Specification-Format)

## Deployment scripts

Make use of the deployment scripts. The scripts will:

    - Deploy to the specified network (included on the script name).
    - Export files to exported-data, to be exported to the frontend project.
    - Export NATSpec documentation to natspec-docs.

### Local

Run ```npm run deploy:local``` to deploy changes or ```npm run deploy:local:reset``` to force deployment.

### Kovan

Run ```npm run deploy:kovan``` to deploy changes or ```npm run deploy:kovan:reset``` to force deployment.

### Mainnet

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

## Contracts
### Deployables
* SLARegistry: Service level agreements registry, single contract
* SLORegistry: Service level objectives registry, single contract
* bDSLA: DSLA token for beta. Can be deployed and minted by anyone
* Messenger: communicates with an Oracle to requestSLI data. Currently integrated with Chainlink
### Not deployables
* SLA: Service level agreement, multiple contracts can be deployed
* SLO: Service level objective, multiple contracts can be deployed
* MinimalSLA: used only for testing purposes. It is used by the Messenger contract to test integration

### Documentation
NATSpec userdoc and devdoc JSON files are included in natspec-docs directory. Use it to check the inputs of the functions, or events parameters.

## Scripts
* ```deploy:ENV:OPTION```: deploy the contracts on ENV environment, with OPTION options.
* ```export-data```: creates the files for the front end (addresses and ABIs) and the NATSpec JSONs
* ```mint-tokens```: mint bDSLA and DAI to account[0] on local env
* ```test:ENV:CONTRACT```: runs the test on ENV env for CONTRACT contract.
* ```truffle:deploy:ENV:OPTION```: runs ```truffle deploy``` on ENV with OPTION options
* ```truffle:exec:SCRIPT:OPTION```: runs ```truffle exec```  SCRIPT script on local env (or OPTION env)
* ```truffle:console:ENV```: runs ```truffle console```  on ENV env
