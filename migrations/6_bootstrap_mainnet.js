require('babel-polyfill');
require('babel-register');

const { networkNamesBytes32 } = require('../constants');
const { envParameters } = require('../environments');
const { generateWeeklyPeriods } = require('../utils');

const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const IERC20 = artifacts.require('IERC20');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const SEMessenger = artifacts.require('SEMessenger');

const periodType = 2;
const periods = 52;
const [periodStarts, periodEnds] = generateWeeklyPeriods(periods);

module.exports = (deployer, network) => {
  deployer.then(async () => {
    if (/mainnet/i.test(network)) {
      if (!!process.env.ONLY_DETAILS === true) return;
      console.log('Starting automated jobs to bootstrap protocol correctly');
      const daiToken = await IERC20.at(envParameters.dslaTokenAddress);
      const usdcToken = await IERC20.at(envParameters.daiTokenAddress);

      console.log('Starting automated job 1: weekly period initialization');
      const periodRegistry = await PeriodRegistry.deployed();
      await periodRegistry.initializePeriod(
        periodType,
        periodStarts,
        periodEnds,
      );

      console.log('Starting automated job 2: allowing DAI and USDC on StakeRegistry');
      const stakeRegistry = await StakeRegistry.deployed();
      await stakeRegistry.addAllowedTokens(daiToken.address);
      await stakeRegistry.addAllowedTokens(usdcToken.address);

      console.log('Starting automated job 3: adding network names to NetworkAnalytics contract');
      const networkAnalytics = await NetworkAnalytics.deployed();
      await networkAnalytics.addMultipleNetworks(networkNamesBytes32);

      console.log('Starting automated job 4: Increasing allowance of NetworkAnalytics contract to 100 LINK');
      const linkToken = await IERC20.at(envParameters.chainlinkTokenAddress);
      await linkToken.approve(
        networkAnalytics.address,
        web3.utils.toWei('100'),
      );

      console.log('Starting automated job 5: Increasing allowance of SEMessenger contract to 100 LINK');
      const seMessenger = await SEMessenger.deployed();
      await linkToken.approve(
        seMessenger.address,
        web3.utils.toWei('100'),
      );

      console.log('Starting automated job 6: Registering the SEMessenger');
      const slaRegistry = await SLARegistry.deployed();
      await slaRegistry.registerMessenger(
        seMessenger.address,
        '',
      );

      console.log('Bootstrap process completed');
    }
  });
};
