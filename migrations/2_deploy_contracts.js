const SLORegistry = artifacts.require("./SLORegistry.sol");
const SLARegistry = artifacts.require("./SLARegistry.sol");
const Messenger = artifacts.require("Messenger");

module.exports = function (deployer, network) {
  // Do not deploy if we are testing
  if (process.env.NODE_ENV === "test") {
    return;
  }

  let chainlinkOracle;
  // Chainlink addresses here: https://docs.chain.link/docs/decentralized-oracles-ethereum-mainnet
  if (network === "kovan" || network === "kovan-fork") {
    chainlinkOracle = "0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e";
  } else if (network === "rinkeby" || network === "rinkeby-fork") {
    chainlinkOracle = "0x7AFe1118Ea78C1eae84ca8feE5C65Bc76CcF879e";
  } else if (network === "mainnet") {
    // TODO: get this address
    chainlinkOracle = "¿?";
  }
  deployer.deploy(Messenger, chainlinkOracle).then(() => {
    deployer.deploy(SLARegistry, Messenger.address);
    deployer.deploy(SLORegistry);
  });
};
