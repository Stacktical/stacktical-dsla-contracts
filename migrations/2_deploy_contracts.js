const WhitelistRegistry = artifacts.require('./WhitelistRegistry.sol');
const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new Oracle Messenger contract, then update the address below
  let messengerAddress = "0xf22e3871f03f89e625Cc0e87cb1B51207B767d01";

  deployer.deploy(WhitelistRegistry)
  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
