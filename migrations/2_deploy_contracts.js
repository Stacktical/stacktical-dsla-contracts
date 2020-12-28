require("babel-register");
require("babel-polyfill");

const { getDeploymentEnv } = require("../environments.config");

const SLORegistry = artifacts.require("SLORegistry");
const SLARegistry = artifacts.require("SLARegistry");
const Messenger = artifacts.require("Messenger");
const bDSLAToken = artifacts.require("bDSLAToken");
const DAI = artifacts.require("DAI");

module.exports = function (deployer, network) {
  if (process.env.NODE_ENV === "test") {
    return;
  }
  return deployer.then(async () => {
    if (process.env.DEPLOY_TOKENS) {
      await deployer.deploy(DAI);
      return await deployer.deploy(bDSLAToken);
    }

    const env = getDeploymentEnv(network);

    await deployer.deploy(
      Messenger,
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      env.chainlinkJobId
    );
    await deployer.deploy(SLARegistry, Messenger.address);
    await deployer.deploy(SLORegistry);
  });
};
