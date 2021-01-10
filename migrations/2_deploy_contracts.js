require('babel-polyfill');
require('babel-register');

const { getChainlinkJobId } = require('../test/helpers');
const { getEnvFromNetwork, needsGetJobId } = require('../environments.config');

const SLORegistry = artifacts.require('SLORegistry');
const SLARegistry = artifacts.require('SLARegistry');
const Messenger = artifacts.require('Messenger');
const bDSLAToken = artifacts.require('bDSLAToken');
const DAI = artifacts.require('DAI');

module.exports = (deployer, network) => {
  if (process.env.TEST_ENV) {
    return;
  }

  deployer.then(async () => {
    if (process.env.DEPLOY_TOKENS) {
      await deployer.deploy(DAI);
      return deployer.deploy(bDSLAToken);
    }

    const env = getEnvFromNetwork(network);

    await deployer.deploy(
      Messenger,
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      !needsGetJobId ? env.chainlinkJobId : await getChainlinkJobId(),
    );
    await deployer.deploy(SLARegistry, Messenger.address);
    return deployer.deploy(SLORegistry);
  });
};
