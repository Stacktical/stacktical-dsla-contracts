const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new Oracle Messenger contract, then update the address below
  let messengerAddress = "0xbcda8BD1412607708584EA37B46E851e373b8204";

  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
