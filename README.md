# stacktical-mvp-contracts

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
    - Export files to exported_data, to be exported to the frontend project.

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
NATSpec userdoc and devdocs JSON files are included in natspec-docs directory
