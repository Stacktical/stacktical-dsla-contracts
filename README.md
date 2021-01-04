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

TODO

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
