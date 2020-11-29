const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new Oracle Messenger contract, then update the address below
  // Kovan
  let messengerAddress = "0x7759Cc4DfEF24781693B2B230f4471efA7aDbe6e";

  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
