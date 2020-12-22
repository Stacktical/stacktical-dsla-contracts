const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new Oracle Messenger contract, then update the address below
  // Kovan
  let messengerAddress = "0xF9C8e8c8b05b028d3e6dc9fECe4775a0CA390122";

  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
