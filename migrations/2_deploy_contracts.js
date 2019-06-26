const WhitelistRegistry = artifacts.require('./WhitelistRegistry.sol');
const SLORegistry = artifacts.require('./SLORegistry.sol');
const SLARegistry = artifacts.require('./SLARegistry.sol');

module.exports =  function(deployer, network) {
  // Make sure to first deploy a new chainlink Messenger contract and update
  // the address here
  let messengerAddress = "0x443499Bb174CA4E04de066c315Bea8F96dA4B3DD";

  deployer.deploy(WhitelistRegistry)
  deployer.deploy(SLORegistry)
  deployer.deploy(SLARegistry, messengerAddress)
}
