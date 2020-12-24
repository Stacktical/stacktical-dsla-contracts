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
NATSpec userdoc and devdoc JSON files are included in natspec-docs directory

## Scripts
    test:local = run all the tests on local network
    test:local:specific = run the test specified at the end of the line on local network
    test:local:messenger = run the test messenger on local network
    test:local:slaRegistry = run the test slaRegistry on local network
    test:kovan = run automated tests on kovan network
    deploy:kovan = deploy updates to kovan network
    deploy:kovan:reset = deploy everything forced to kovan network
    deploy:local = deploy updates to local network
    deploy:local:reset = deploy everything forced to local network
    remix = connect remix to local repository
    compile = compile contracts using truffle
    turffle:console:local = open the truffle console for local network
    prettier:contracts = prettify contracts
    export-data = exports addresses, abis and create the natspec-docs
    export-data:scripts = runs the below scripts
    export-data:scripts:abis = creates the abis
    export-data:scripts:addresses = creates the addresses.ts file
    export-data:scripts:natspec-docs = compile the contracts and create the natspec-docs on natspec-docs folder
