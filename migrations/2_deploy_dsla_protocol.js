require('babel-polyfill');
require('babel-register');

const { getEnvFromNetwork } = require('../environments');

const PeriodRegistry = artifacts.require('PeriodRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
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
      const dslaTokenAddress = /mainnet/i.test(network) ? env.dslaTokenAddress : (await deployer.deploy(bDSLA)).address;
      const periodRegistry = await deployer.deploy(PeriodRegistry);
      const sloRegistry = await deployer.deploy(SLORegistry);
      const messengerRegistry = await deployer.deploy(MessengerRegistry);

      const stakeRegistry = await deployer.deploy(
        StakeRegistry,
        dslaTokenAddress,
      );

      return deployer.deploy(
        SLARegistry,
        sloRegistry.address,
        periodRegistry.address,
        messengerRegistry.address,
        stakeRegistry.address,
        env.checkPastPeriods,
      );
    });
  }
};
