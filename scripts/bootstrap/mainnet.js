require('babel-polyfill');
require('babel-register');

const fs = require('fs');
const path = require('path');
const { getIPFSHash } = require('../../utils');
const { SENetworkNamesBytes32 } = require('../../constants');
const { getEnvFromNodeEnv } = require('../../environments');
const { generateWeeklyPeriods } = require('../../utils');

const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const IERC20 = artifacts.require('IERC20');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const SEMessenger = artifacts.require('SEMessenger');

const periodType = 2;
const [periodStarts, periodEnds] = generateWeeklyPeriods(52, 0);
const seMessengerSpec = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../semessenger.mainnet.spec.json')),
);

module.exports = async (callback) => {
  const envParameters = getEnvFromNodeEnv();
  console.log('Starting automated jobs to bootstrap protocol correctly');

  console.log('Starting automated job 1: allowing DAI and USDC on StakeRegistry');
  const stakeRegistry = await StakeRegistry.deployed();
  await stakeRegistry.addAllowedTokens(envParameters.daiTokenAddress);
  await stakeRegistry.addAllowedTokens(envParameters.usdcTokenAddress);

  console.log('Starting automated job 2: weekly period initialization');
  const periodRegistry = await PeriodRegistry.deployed();
  await periodRegistry.initializePeriod(periodType, periodStarts, periodEnds);

  console.log(
    'Starting automated job 3: Adding the network names to the NetworkAnalytics contract',
  );
  const networkAnalytics = await NetworkAnalytics.deployed();
  await networkAnalytics.addMultipleNetworks(SENetworkNamesBytes32);

  console.log(
    'Starting automated job 4: Increasing allowance for NetworkAnalytics and SEMessenger with 25 link tokens',
  );
  const seMessenger = await SEMessenger.deployed();
  const linkToken = await IERC20.at(envParameters.chainlinkTokenAddress);
  await linkToken.approve(networkAnalytics.address, web3.utils.toWei('25'));
  await linkToken.approve(seMessenger.address, web3.utils.toWei('25'));

  console.log('Starting automated job 5: Registering messenger on the SLARegistry');
  const slaRegistry = await SLARegistry.deployed();
  const updatedSpec = {
    ...seMessengerSpec,
    timestamp: new Date().toISOString(),
  };
  const seMessengerSpecIPFS = await getIPFSHash(updatedSpec);

  await slaRegistry.registerMessenger(
    seMessenger.address,
    `https://ipfs.dsla.network/ipfs/${seMessengerSpecIPFS}`,
  );
  console.log('Bootstrap process completed');
  callback(null);
};
