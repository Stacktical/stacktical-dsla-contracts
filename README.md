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

## Deploying

1. Make sure a new `Messenger` contract has been deployed to connect with the oracle ([stacktical-dsla-oraclize](https://github.com/Stacktical/stacktical-dsla-oraclize)).

2. Update the `messengerAddress` contract address in `migrations/2_deploy_contracts.js` with the newly deployed `Messenger` contract address.

3. Run `truffle migrate` with the required options (network, etc.)

## Contracts

* SLARegistry (Service level agreements registry, single contract)
* SLA (Service level agreement, multiple contracts can be deployed)
* SLORegistry (Service level objectives registry, single contract)
* SLO (Service level objective, multiple contracts can be deployed)
* WhitelistRegistry (Whitelists registry, single contract)
* Whitelist (Whitelist, multiple contracts can be deployed)

### SLARegistry

The SLA registry handles creation of SLA contracts. The registry stores the SLA contract address and version of the contract. The SLA registry is used by the dapp to retrieve the right SLA contract for a specific id.

#### Storage

`mapping(address => SLA[]) private userToSLAs;`
*Mapping to get the SLA's that are deployed by the given address*


`SLA[] public SLAs;`
*[TODO] Array with all SLA addresses*


`mapping(SLA => bytes32) public SLAToVersion;`
*[TODO] Mapping to get the version of the given SLA*

#### Public functions

```
createSLA(
    address _owner,
    Whitelist _whitelist,
    IERC20 _dsla,
    bytes32[] memory _SLONames,
    SLO[] memory _SLOs,
    uint _compensationAmount,
    uint _stake,
    string memory _ipfsHash
)
```
*Creates a new SLA contract*

```
userSLAs(address _user)
```
*Returns SLAs created by the given user address*

```
userSLACount(address _user)
```
*Returns the amount of SLAs created by the given user address*

```
allSLAs()
```
*Returns all SLAs*

```
SLACount()
```
*Returns total amount of SLAs*

```
paginatedSLAs(
    uint _start,
    uint _end
)
```
*Returns SLAs for the given index range*


### SLA

The SLA contract contains all the rules for handling compensations and has a pool of DSLA tokens to use when compensating. When the SLA contract is live, the owner is able to input SLI values. The contract also registers users that subscribe to it and when SLI values are above/below the provided threshold all subscribed users will be compensated.

#### Storage

`address private _owner;`
*Stores the address of the SLA owner*

`IERC20 public dsla;`
*The used DSLA token contract*

`Whitelist public whitelist;`
*The used whitelist contract*

`bytes32 public version;`
*[TODO] bytes32 version of the deployed contract code*

`bool public isActive;`
*[TODO] boolean for enabling/disabling SLA*

`string public ipfsHash;`
*ipfsHash containing SLA metadata*

```
struct SLI {
    uint timestamp;
    uint value;
    string ipfsHash;
}
```
*SLI struct for storing registered SLIs*

`bytes[32] public SLONames`
*[TODO] Array containing all SLOs*

`mapping(bytes32 => SLO) public SLOs;`
*mapping for getting the SLO contract from the bytes32 SLO name*

`mapping(bytes32 => SLI[]) public SLIs;`
*mapping for getting the registered SLIs for the given bytes32 SLO name*

`mapping (address => uint) public userToCompensated;`
*Mapping for tracking how much a user is not entitled to withdraw*

`mapping (address => uint) public userToWithdrawn;`
*Mapping for tracking how much a user has withdrawn*


`uint public compensationPerUser;`
*Total compensation available per user*

`uint public compensationAmount;`
*Amount of tokens distributed to a single user on SLA breach*

#### Public functions

```
registerSLI(
    bytes32 _SLOName,
    uint _value,
    string calldata _hash
) onlyOwner
```
*Register a new SLI, compensations are triggered on SLO breach*

```
changeWhitelist(Whitelist _newWhitelist) onlyOwner
```
*Change the whitelist contract*

```
signAgreement()
```
*Sign the service level agreement with the sender account*

```
withdrawCompensation()
```
*Claim the entitled compensation amount for the sender account*

```
withdrawCompensations(address[] _users)
```
*[TODO] withdraw the entitled compensation amount for the given user addresses, the sender receives an incentive*


```
isSubscribed(address _userAddress)
```
*Returns true if the given address is subscribed to the SLA*

### SLORegistry

The SLO registry handles creation of SLO contracts and stores them.

#### Storage

`mapping(address => SLO[]) private userToSLOs;`
*Mapping to get the SLO's that are deployed by the given user address*


`SLO[] public SLOs;`
*[TODO] Array with all deployed SLOs*


#### Public functions

```
createSLO(uint _value, SLO.SLOTypes _SLOType, bytes32 _name)
```
*Creates a new SLO contract*

```
userSLOs(address _user)
```
*Returns SLOs created by the given user address*

### SLO

The SLO contracts will hold the logic and values to check SLI values against and returns a boolean. Multiple SLO’s can be created and a single SLO can be used in multiple SLA’s.

#### Storage

`enum SLOTypes { EqualTo, NotEqualTo, SmallerThan, SmallerOrEqualTo, GreaterThan, GreaterOrEqualTo }`
*Enum with the available SLO types for checking for breaches*


`SLOTypes public SLOType;`
*The SLO type this contract is deployed with*

`uint public value;`
*The SLO value*

`bytes32 public name;`
*The name of the SLO in bytes*

#### Functions

`isSLOHonored(uint _value)`
*Checks if the SLO is honored for the given value, returns false on SLO breach*

### WhitelistRegistry

The whitelistRegistry handles whitelist contract creation. Whitelists are used in the SLA contracts to check if a user is eligible to subscribe to the SLA, whitelists are not mandatory in a SLA.

#### Storage

`mapping(address => Whitelist[]) private userToWhitelists;`
*Mapping to get the whitelists that are deployed by the given user address*

#### Public functions

`createWhitelist()`
*Creates a new Whitelist contract*

`userWhitelists(address _user)`
*Returns Whitelists created by the given user address*

### Whitelist

Whitelists are used in SLA contracts to check if a user is eligible to subscribe. One whitelist can be used by multiple SLA contracts.

#### Storage

`address private _owner;`
*Stores the address of the SLA owner*

`mapping(address => bool) private userToWhitelisted;`
*Mapping to store the whitelist status of user addresses*

#### Public functions

`addUsersToWhitelist(address[] memory _userAddresses) onlyOwner`
*Whitelists an array of user addresses*

`addUserToWhitelist(address _userAddress) onlyOwner`
*Whitelists a single user address*

`removeUsersFromWhitelist(address[] memory _userAddresses) onlyOwner`
*Removes an array of user addresses from the whitelist*

`removeUserFromWhitelist(address _userAddress) onlyOwner`
*Removes a single user address from the whitelist*

`isWhitelisted(address _userAddress)`
*Returns true if the given user address is whitelisted*
