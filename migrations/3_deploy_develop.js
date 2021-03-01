require('babel-polyfill');
require('babel-register');

const { generatePeriods, getIPFSHash, eventListener } = require('../test/helpers');
const { networks, networkNames, networkNamesBytes32 } = require('../constants');
const { envParameters, needsGetJobId } = require('../environments');

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
const initialTokenSupply = '1000000';
const stakeAmount = initialTokenSupply / 100;
const stakeAmountWei = toWei(String(stakeAmount));

const sloValue = 95000;
const sloType = 4;
const periodType = 2;
const [periodStarts, periodEnds] = generatePeriods(52);
const slaNetworkBytes32 = networkNamesBytes32[0];
const slaNetwork = networkNames[0];

module.exports = (deployer, network) => {
  deployer.then(async () => {
    if (/develop/i.test(network)) {
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

      console.log('Starting automated job 4: Asking for network analytics for first period');
      const networkAnalytics = await NetworkAnalytics.deployed();
      await networkAnalytics.addNetwork(slaNetworkBytes32);
      const linkToken = await IERC20.at(envParameters.chainlinkTokenAddress);
      await linkToken.transfer(
        networkAnalytics.address,
        web3.utils.toWei('0.2'),
      );
      // periods 0 is already finished
      await networkAnalytics.requestAnalytics(0, periodType, slaNetworkBytes32);
      await eventListener(networkAnalytics, 'AnalyticsReceived');

      console.log('Starting automated job 5: Funding SEMessenger with 10 link tokens');
      const seMessenger = await SEMessenger.deployed();
      await linkToken.transfer(
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
      await slaRegistry.createSLA(
        slo,
        ipfsHash,
        periodType,
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        seMessenger.address,
        false,
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
      await bdslaToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, bdslaToken.address);
      await bdslaToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, bdslaToken.address);
      await bdslaToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, bdslaToken.address);
      await daiToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, daiToken.address);
      await daiToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, daiToken.address);
      await daiToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, daiToken.address);
      await usdcToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, usdcToken.address);
      await usdcToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, usdcToken.address);
      await usdcToken.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, usdcToken.address);

      // NotOwner
      // 2 * dai + 3 * usdc
      console.log('Starting automated job 9.2: notOwner: 0 bDSLA, 20000 DAI, 30000 USDC');
      await daiToken.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, daiToken.address, { from: notOwner });
      await daiToken.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, daiToken.address, { from: notOwner });
      await usdcToken.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, usdcToken.address, { from: notOwner });
      await usdcToken.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, usdcToken.address, { from: notOwner });
      await usdcToken.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, usdcToken.address, { from: notOwner });

      console.log('Starting automated job 10: Request SLI for period 0');
      await slaRegistry.requestSLI(0, sla.address);
      await eventListener(sla, 'SLICreated');

      console.log('Bootstrap process completed');
    }
  });
};
