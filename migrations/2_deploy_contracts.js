require('babel-polyfill');
require('babel-register');

const { networkNamesBytes32 } = require('../constants');
const { getChainlinkJobId } = require('../test/helpers');
const { getEnvFromNetwork, needsGetJobId, getIndexerAPIUrl } = require('../environments');

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
      await getIndexerAPIUrl(),
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      !needsGetJobId ? env.chainlinkJobId : await getChainlinkJobId(),
    );

    await deployer.deploy(
      SLARegistry,
      Messenger.address,
      env.startsArray,
      env.endsArray,
      networkNamesBytes32,
    );
    return deployer.deploy(SLORegistry);
  });
};
