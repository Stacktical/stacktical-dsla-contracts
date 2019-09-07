const WhitelistRegistry = artifacts.require('./WhitelistRegistry.sol');
const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new chainlink Messenger contract and update
  // the address here
  let messengerAddress = "0x0Ce6eEE973295d655bb336C8a8C0Dbc5716b453D";

  deployer.deploy(WhitelistRegistry)
  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
