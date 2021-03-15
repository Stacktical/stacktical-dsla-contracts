require('babel-polyfill');
require('babel-register');

const { getIPFSHash, eventListener } = require('../test/helpers');
const { networks, networkNames, networkNamesBytes32 } = require('../constants');
const { envParameters } = require('../environments');
const { generateWeeklyPeriods } = require('../utils');

const { toWei } = web3.utils;

const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const SLORegistry = artifacts.require('SLORegistry');
const IERC20 = artifacts.require('IERC20');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const SLA = artifacts.require('SLA');
const SEMessenger = artifacts.require('SEMessenger');
const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');
const initialTokenSupply = '10000000';
const stakeAmount = initialTokenSupply / 100;
const stakeAmountTimesWei = (times) => toWei(String(stakeAmount * times));

const sloValue = 50000;
const sloType = 4;
const periodType = 2;
const [periodStarts, periodEnds] = generateWeeklyPeriods(52, 7);
const slaNetworkBytes32 = networkNamesBytes32[0];
const slaNetwork = networkNames[0];

module.exports = (deployer, network) => {
  deployer.then(async () => {
    if (/develop/i.test(network)) {
      if (!!process.env.ONLY_DETAILS === true) return;
      console.log('Starting automated jobs to bootstrap protocol correctly');
      const [owner, notOwner] = await web3.eth.getAccounts();

      console.log('Starting automated job 1: token deployment and miniting');
      const daiToken = await deployer.deploy(DAI);
      const usdcToken = await deployer.deploy(USDC);
      const bdslaToken = await bDSLA.deployed();
      // mint to owner
      await bdslaToken.mint(owner, toWei(initialTokenSupply));
      await usdcToken.mint(owner, toWei(initialTokenSupply));
      await daiToken.mint(owner, toWei(initialTokenSupply));
      // mint to notOwner
      await bdslaToken.mint(notOwner, toWei(initialTokenSupply));
      await usdcToken.mint(notOwner, toWei(initialTokenSupply));
      await daiToken.mint(notOwner, toWei(initialTokenSupply));

      console.log('Starting automated job 2: weekly period initialization');
      const periodRegistry = await PeriodRegistry.deployed();
      await periodRegistry.initializePeriod(
        periodType,
        periodStarts,
        periodEnds,
      );

      console.log('Starting automated job 3: allowing DAI and USDC on StakeRegistry');
      const stakeRegistry = await StakeRegistry.deployed();
      await stakeRegistry.addAllowedTokens(daiToken.address);
      await stakeRegistry.addAllowedTokens(usdcToken.address);

      console.log('Starting automated job 4: Adding the network names to the NetworkAnalytics contract');
      const networkAnalytics = await NetworkAnalytics.deployed();
      await networkAnalytics.addMultipleNetworks(networkNamesBytes32);

      console.log('Starting automated job 5: Increasing allowance for NetworkAnalytics and SEMessenger with 10 link tokens');
      const seMessenger = await SEMessenger.deployed();
      const linkToken = await IERC20.at(envParameters.chainlinkTokenAddress);
      await linkToken.approve(
        networkAnalytics.address,
        web3.utils.toWei('10'),
      );
      await linkToken.approve(
        seMessenger.address,
        web3.utils.toWei('10'),
      );

      // deploy sla contract
      console.log('Starting automated job 6: Creating SLO');
      const sloRegistry = await SLORegistry.deployed();
      await sloRegistry.createSLO(sloValue, sloType);
      const slo = await sloRegistry.sloAddresses.call(sloValue, sloType);

      console.log('Starting automated job 7: Creating SLA');
      const serviceMetadata = {
        serviceName: networks[slaNetwork].validators[0],
        serviceDescription: 'Official bDSLA Beta Partner.',
        serviceImage:
        'https://storage.googleapis.com/bdsla-incentivized-beta/validators/chainode.svg',
        serviceURL: 'https://bdslaToken.network',
        serviceAddress: 'one18hum2avunkz3u448lftwmk7wr88qswdlfvvrdm',
        serviceTicker: slaNetwork,
      };
      const ipfsHash = await getIPFSHash(serviceMetadata);
      const slaRegistry = await SLARegistry.deployed();
      const initialPeriodId = 0;
      const finalPeriodId = 51;
      const dslaDepositByPeriod = 20000;
      const dslaDeposit = toWei(
        String(dslaDepositByPeriod * (finalPeriodId - initialPeriodId + 1)),
      );
      await bdslaToken.approve(stakeRegistry.address, dslaDeposit);
      const whitelisted = false;
      const periodDefinitions = await periodRegistry.getPeriodDefinitions.call();
      console.log(periodDefinitions);
      await slaRegistry.createSLA(
        slo,
        whitelisted,
        seMessenger.address,
        periodType,
        initialPeriodId,
        finalPeriodId,
        ipfsHash,
        [slaNetworkBytes32],
      );

      console.log('Starting automated job 8: Adding bDSLA, DAI and USDC tokens as allowed to SLA contract');
      const slaAddresses = await slaRegistry.userSLAs(owner);
      const sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
      await sla.addAllowedTokens(bdslaToken.address);
      await sla.addAllowedTokens(daiToken.address);
      await sla.addAllowedTokens(usdcToken.address);

      console.log('Starting automated job 9: Stake on owner and notOwner pools');
      console.log('Starting automated job 9.1: owner: 30000 bDSLA, 30000 DAI, 30000 USDC');
      // Owner
      // 3 * bsdla + 3 * dai + 3 usdc
      await bdslaToken.approve(sla.address, stakeAmountTimesWei(3));
      await sla.stakeTokens(stakeAmountTimesWei(3), bdslaToken.address);
      await daiToken.approve(sla.address, stakeAmountTimesWei(3));
      await sla.stakeTokens(stakeAmountTimesWei(3), daiToken.address);
      await usdcToken.approve(sla.address, stakeAmountTimesWei(3));
      await sla.stakeTokens(stakeAmountTimesWei(3), usdcToken.address);

      // NotOwner
      // 3 * bdsla + 2 * dai
      console.log('Starting automated job 9.2: notOwner: 0 bDSLA, 20000 DAI, 30000 USDC');
      await bdslaToken.approve(sla.address, stakeAmountTimesWei(3), { from: notOwner });
      await sla.stakeTokens(stakeAmountTimesWei(3), bdslaToken.address, { from: notOwner });
      await daiToken.approve(sla.address, stakeAmountTimesWei(2), { from: notOwner });
      await sla.stakeTokens(stakeAmountTimesWei(2), daiToken.address, { from: notOwner });

      // period 0 is already finished
      console.log('Starting automated job 10: Request Analytics and SLI for period 0');
      const ownerApproval = true;
      const callerReward = true;
      // period 0 is already finished
      networkAnalytics.requestAnalytics(
        0, periodType, slaNetworkBytes32, ownerApproval, callerReward,
      );
      await eventListener(networkAnalytics, 'AnalyticsReceived');
      await slaRegistry.requestSLI(0, sla.address, ownerApproval);
      await eventListener(sla, 'SLICreated');

      // period 1 is already finished
      console.log('Starting automated job 11: Request Analytics and SLI for period 1');
      networkAnalytics.requestAnalytics(
        1, periodType, slaNetworkBytes32, ownerApproval, callerReward,
      );
      await eventListener(networkAnalytics, 'AnalyticsReceived');
      await slaRegistry.requestSLI(1, sla.address, callerReward);
      await eventListener(sla, 'SLICreated');

      // period 2 is already finished
      console.log('Starting automated job 12: Request Analytics for period 2');
      networkAnalytics.requestAnalytics(
        2, periodType, slaNetworkBytes32, ownerApproval, callerReward,
      );
      await eventListener(networkAnalytics, 'AnalyticsReceived');

      // period 3 is already finished
      console.log('Starting automated job 13: Request Analytics for period 3');
      networkAnalytics.requestAnalytics(
        3, periodType, slaNetworkBytes32, ownerApproval, callerReward,
      );
      await eventListener(networkAnalytics, 'AnalyticsReceived');

      // period 4 is already finished
      console.log('Starting automated job 14: Request Analytics for period 4');
      networkAnalytics.requestAnalytics(
        4, periodType, slaNetworkBytes32, ownerApproval, callerReward,
      );
      await eventListener(networkAnalytics, 'AnalyticsReceived');

      // period 5 is already finished
      console.log('Starting automated job 15: Request Analytics for period 5');
      networkAnalytics.requestAnalytics(
        5, periodType, slaNetworkBytes32, ownerApproval, callerReward,
      );
      await eventListener(networkAnalytics, 'AnalyticsReceived');

      console.log('Bootstrap process completed');
    }
  });
};
