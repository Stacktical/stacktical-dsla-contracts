const { getDeploymentEnv } = require("../environments.config");

const SLORegistry = artifacts.require("SLORegistry");
const SLARegistry = artifacts.require("SLARegistry");
const Messenger = artifacts.require("Messenger");
const bDSLAToken = artifacts.require("bDSLAToken");

module.exports = function (deployer, network) {
  // Do not deploy if we are testing
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const env = getDeploymentEnv(network);

  if (process.env.DEPLOY_BDSLA) {
    return deployer.deploy(bDSLAToken);
  }

  deployer
    .deploy(
      Messenger,
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      env.chainlinkJobId
    )
    .then((messenger) => {
      return deployer.deploy(SLARegistry, messenger.address).then(() => {
        return deployer.deploy(SLORegistry);
      });
    });
};
