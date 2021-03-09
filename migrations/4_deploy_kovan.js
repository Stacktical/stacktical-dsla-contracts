require('babel-polyfill');
require('babel-register');

const { generatePeriods } = require('../test/helpers');
const { networkNamesBytes32 } = require('../constants');

const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const SLORegistry = artifacts.require('SLORegistry');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const USDC = artifacts.require('USDC');

const sloValue = 95000;
const sloType = 4;
const periodType = 2;
const yearlyPeriods = 52;
const [periodStarts, periodEnds] = generatePeriods(52);
const slaNetworkBytes32 = networkNamesBytes32[0];

module.exports = (deployer, network) => {
  deployer.then(async () => {
    if (/kovan/i.test(network)) {
      await deployer.deploy(USDC);
      const sloRegistry = await SLORegistry.deployed();
      const periodRegistry = await PeriodRegistry.deployed();
      const networkAnalytics = await NetworkAnalytics.deployed();

      await sloRegistry.createSLO(sloValue, sloType);

      await periodRegistry.initializePeriod(
        periodType,
        periodStarts,
        periodEnds,
        yearlyPeriods,
      );

      await networkAnalytics.addNetwork(slaNetworkBytes32);
    }
  });
};