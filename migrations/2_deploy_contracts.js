require('babel-polyfill');
require('babel-register');

const { toWei } = require('web3-utils');
const { getChainlinkJobId, eventListener } = require('../test/helpers');
const { getEnvFromNetwork, needsGetJobId } = require('../environments');

const PeriodRegistry = artifacts.require('PeriodRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const PreCoordinator = artifacts.require('PreCoordinator');
const SLORegistry = artifacts.require('SLORegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const SEMessenger = artifacts.require('SEMessenger');
const Details = artifacts.require('Details');

// For dev
const bDSLA = artifacts.require('bDSLA');

module.exports = (deployer, network) => {
  if (!/testing/i.test(network)) {
    deployer.then(async () => {
      if (!!process.env.ONLY_DETAILS === true) {
        return deployer.deploy(Details);
      }
      await deployer.deploy(Details);
      const env = getEnvFromNetwork(network);
      const dslaTokenAddress = env?.dslaTokenAddress || (await deployer.deploy(bDSLA)).address;
      const periodRegistry = await deployer.deploy(PeriodRegistry);
      const sloRegistry = await deployer.deploy(SLORegistry);
      const messengerRegistry = await deployer.deploy(MessengerRegistry);

      const chainlinkJobId = !needsGetJobId ? env.chainlinkJobId : await getChainlinkJobId();

      const stakeRegistry = await deployer.deploy(
        StakeRegistry,
        dslaTokenAddress,
      );

      const preCoordinator = await deployer.deploy(
        PreCoordinator,
        env.chainlinkTokenAddress,
      );

      const minResponses = 1;
      const preCoordinatorConfiguration = /mainnet/i.test(network)
        ? {
          oracles: ['mainnet_oracle_1', 'mainnet_oracle_2', 'mainnet_oracle_3', 'mainnet_oracle_4'],
          jobIds: ['mainnet_jobid_1', 'mainnet_jobid_2', 'mainnet_jobid_3', 'mainnet_jobid4'],
          payments: ['mainnet_payment_1', 'mainnet_payment_2', 'mainnet_payment_3', 'mainnet_payment4'],
        }
        : {
          oracles: [env.chainlinkOracleAddress],
          jobIds: [chainlinkJobId],
          payments: [toWei('0.1')],
        };

      preCoordinator.createServiceAgreement(
        minResponses,
        preCoordinatorConfiguration.oracles,
        preCoordinatorConfiguration.jobIds,
        preCoordinatorConfiguration.payments,

      );
      const { values: { saId } } = await eventListener(preCoordinator, 'NewServiceAgreement');

      const networkAnalytics = await deployer.deploy(
        NetworkAnalytics,
        preCoordinator.address,
        env.chainlinkTokenAddress,
        saId,
        periodRegistry.address,
        stakeRegistry.address,
        preCoordinatorConfiguration.payments.length,
      );

      await deployer.deploy(
        SEMessenger,
        preCoordinator.address,
        env.chainlinkTokenAddress,
        saId,
        networkAnalytics.address,
        preCoordinatorConfiguration.payments.length,
      );

      return deployer.deploy(
        SLARegistry,
        sloRegistry.address,
        periodRegistry.address,
        messengerRegistry.address,
        stakeRegistry.address,
      );
    });
  }
};
