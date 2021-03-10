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

      const preCoordinator = await deployer.deploy(
        PreCoordinator,
        env.chainlinkTokenAddress,
      );

      const minResponses = 1;
      const oracles = [env.chainlinkOracleAddress];
      const jobIds = [chainlinkJobId];
      const payments = [toWei('0.1')];
      preCoordinator.createServiceAgreement(
        minResponses, oracles, jobIds, payments,
      );
      const { values: { saId } } = await eventListener(preCoordinator, 'NewServiceAgreement');

      const networkAnalytics = await deployer.deploy(
        NetworkAnalytics,
        preCoordinator.address,
        env.chainlinkTokenAddress,
        saId,
        periodRegistry.address,
      );

      const seMessenger = await deployer.deploy(
        SEMessenger,
        preCoordinator.address,
        env.chainlinkTokenAddress,
        saId,
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

      return slaRegistry.setMessengerSLARegistryAddress(
        seMessenger.address,
      );
    });
  }
};
