const { getDeploymentEnv } = require("../environments.config");

const SLORegistry = artifacts.require("./SLORegistry.sol");
const SLARegistry = artifacts.require("./SLARegistry.sol");
const Messenger = artifacts.require("Messenger");

module.exports = function (deployer, network) {
  // Do not deploy if we are testing
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const env = getDeploymentEnv(network);

  deployer
    .deploy(
      Messenger,
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      env.chainlinkJobId
    )
    .then(() => {
      deployer.deploy(SLARegistry, Messenger.address);
      deployer.deploy(SLORegistry);
    });
};
