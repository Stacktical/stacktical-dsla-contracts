require('babel-polyfill');
require('babel-register');

const { isTestingNetwork } = require('../environments');
const { getChainlinkJobId } = require('../test/helpers');
const { getEnvFromNetwork, needsGetJobId } = require('../environments');

const PeriodRegistry = artifacts.require('PeriodRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const SEMessenger = artifacts.require('SEMessenger');

// For dev
const bDSLAToken = artifacts.require('bDSLAToken');

module.exports = (deployer, network) => {
  deployer.then(async () => {
    const env = getEnvFromNetwork(network);
    const dslaTokenAddress = env?.dslaTokenAddress || (await deployer.deploy(bDSLAToken)).address;
    const periodRegistry = await deployer.deploy(PeriodRegistry);
    const sloRegistry = await deployer.deploy(SLORegistry);
    const messengerRegistry = await deployer.deploy(MessengerRegistry);
    const networkAnalytics = await deployer.deploy(
      NetworkAnalytics,
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      !needsGetJobId ? env.chainlinkJobId : await getChainlinkJobId(),
      periodRegistry.address,
    );
    const seMessenger = await deployer.deploy(
      SEMessenger,
      env.chainlinkOracleAddress,
      env.chainlinkTokenAddress,
      !needsGetJobId ? env.chainlinkJobId : await getChainlinkJobId(),
      networkAnalytics.address,
    );

    const stakeRegistry = await deployer.deploy(
      StakeRegistry,
      dslaTokenAddress,
    );

    const slaRegistry = await deployer.deploy(
      SLARegistry,
      sloRegistry.address,
      periodRegistry.address,
      messengerRegistry.address,
      stakeRegistry.address,
    );

    await slaRegistry.setMessengerSLARegistryAddress(
      seMessenger.address,
    );
  });
};
