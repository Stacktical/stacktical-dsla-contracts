const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new Oracle Messenger contract, then update the address below
  let messengerAddress = "0x866a99d30AaE05e65ff16C862b4e56f1C41D5791";

  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
