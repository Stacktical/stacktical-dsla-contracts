const WhitelistRegistry = artifacts.require('./WhitelistRegistry.sol');
const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  deployer.deploy(WhitelistRegistry)
  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry)
}
