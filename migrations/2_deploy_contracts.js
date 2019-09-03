const WhitelistRegistry = artifacts.require('./WhitelistRegistry.sol');
const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new chainlink Messenger contract and update
  // the address here
  let messengerAddress = "0x3d15f833be4a9ea2d5b6825a79867554919362fc";

  deployer.deploy(WhitelistRegistry)
  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
