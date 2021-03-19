require('babel-polyfill');
require('babel-register');

const { toWei } = require('web3-utils');
const { getChainlinkJobId, eventListener } = require('../test/helpers');
const { getEnvFromNetwork } = require('../environments');

const PeriodRegistry = artifacts.require('PeriodRegistry');
const PreCoordinator = artifacts.require('PreCoordinator');
const StakeRegistry = artifacts.require('StakeRegistry');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const SEMessenger = artifacts.require('SEMessenger');

module.exports = (deployer, network) => {
  if (!/testing/i.test(network)) {
    deployer.then(async () => {
      if (!!process.env.ONLY_DETAILS === true) return;
      const env = getEnvFromNetwork(network);
      const periodRegistry = await PeriodRegistry.deployed();
      const stakeRegistry = await StakeRegistry.deployed();

      const chainlinkJobId = await getChainlinkJobId();

      const preCoordinator = await deployer.deploy(
        PreCoordinator,
        env.chainlinkTokenAddress,
      );

      const minResponses = 1;
      const preCoordinatorConfiguration = /develop/i.test(network)
        ? {
          oracles: [env.chainlinkOracleAddress],
          jobIds: [chainlinkJobId],
          payments: [toWei('0.1')],
        }
        : env.preCoordinatorConfiguration;

      preCoordinator.createServiceAgreement(
        minResponses,
        preCoordinatorConfiguration.oracles,
        preCoordinatorConfiguration.jobIds,
        preCoordinatorConfiguration.payments,
      );

      const { values: { saId } } = await eventListener(preCoordinator, 'NewServiceAgreement');
      const feeMultiplier = preCoordinatorConfiguration.payments.length;
      const networkAnalytics = await deployer.deploy(
        NetworkAnalytics,
        preCoordinator.address,
        env.chainlinkTokenAddress,
        saId,
        periodRegistry.address,
        stakeRegistry.address,
        feeMultiplier,
      );

      await deployer.deploy(
        SEMessenger,
        preCoordinator.address,
        env.chainlinkTokenAddress,
        saId,
        networkAnalytics.address,
        feeMultiplier,
      );
    });
  }
};
