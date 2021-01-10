require('babel-polyfill');
require('babel-register');

const { getChainlinkJobId } = require('../test/helpers');
const { isTestEnv } = require('../environments.config');

const { getDeploymentEnv } = require('../environments.config');

const SLORegistry = artifacts.require('SLORegistry');
const SLARegistry = artifacts.require('SLARegistry');
const Messenger = artifacts.require('Messenger');
const bDSLAToken = artifacts.require('bDSLAToken');
const DAI = artifacts.require('DAI');

module.exports = (deployer, network) => {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  deployer.then(async () => {
    if (process.env.DEPLOY_TOKENS) {
      await deployer.deploy(DAI);
      return deployer.deploy(bDSLAToken);
    }

    const env = getDeploymentEnv(network);

    await deployer.deploy(
      Messenger,
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      !isTestEnv ? env.chainlinkJobId : await getChainlinkJobId(),
    );
    await deployer.deploy(SLARegistry, Messenger.address);
    return deployer.deploy(SLORegistry);
  });
};
