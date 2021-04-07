const { SENetworkNamesBytes32, SENetworkNames, SENetworks } = require('../../constants');
const { getIPFSHash, eventListener } = require('../../utils');

const { toWei } = web3.utils;

const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const StakeRegistry = artifacts.require('StakeRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const SEMessenger = artifacts.require('SEMessenger');
const bDSLA = artifacts.require('bDSLA');
const SLA = artifacts.require('SLA');
const initialTokenSupply = '10000000';
const stakeAmount = initialTokenSupply / 100;
const stakeAmountTimesWei = (times) => toWei(String(stakeAmount * times));
const sloValue = 50000;
const sloType = 4;
const periodType = 2;
const slaNetworkBytes32 = SENetworkNamesBytes32[0];
const slaNetwork = SENetworkNames[0];

module.exports = async (callback) => {
  try {
    console.log('Starting SLA deployment process');
    console.log('Starting process 1: Allowance on Stake registry to deploy SLA');
    const initialPeriodId = 0;
    const finalPeriodId = 1;
    const dslaDepositByPeriod = 20000;
    const dslaDeposit = toWei(
      String(dslaDepositByPeriod * (finalPeriodId - initialPeriodId + 1)),
    );
    const stakeRegistry = await StakeRegistry.deployed();
    const bdslaToken = await bDSLA.deployed();
    await bdslaToken.approve(stakeRegistry.address, dslaDeposit);

    console.log('Starting process 2: Deploy SLA');
    const serviceMetadata = {
      serviceName: SENetworks[slaNetwork].validators[0],
      serviceDescription: 'Official bDSLA Beta Partner.',
      serviceImage:
      'https://storage.googleapis.com/bdsla-incentivized-beta/validators/chainode.svg',
      serviceURL: 'https://bdslaToken.network',
      serviceAddress: 'one18hum2avunkz3u448lftwmk7wr88qswdlfvvrdm',
      serviceTicker: slaNetwork,
    };
    const ipfsHash = await getIPFSHash(serviceMetadata);
    const seMessenger = await SEMessenger.deployed();
    const slaRegistry = await SLARegistry.deployed();
    const whitelisted = false;
    await slaRegistry.createSLA(
      sloValue,
      sloType,
      whitelisted,
      seMessenger.address,
      periodType,
      initialPeriodId,
      finalPeriodId,
      ipfsHash,
      [slaNetworkBytes32],
    );

    const [owner, notOwner] = await web3.eth.getAccounts();
    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
    console.log(`SLA address: ${slaAddresses[slaAddresses.length - 1]}`);

    await sla.addAllowedTokens(bdslaToken.address);

    console.log('Starting process 3: Stake on owner and notOwner pools');
    console.log('Starting process 3.1: owner: 30000 bDSLA');
    // Owner
    // 3 * bsdla
    await bdslaToken.approve(sla.address, stakeAmountTimesWei(3));
    await sla.stakeTokens(stakeAmountTimesWei(3), bdslaToken.address);

    // NotOwner
    // 3 * bdsla
    console.log('Starting process 3.2: notOwner: 2000 bDSLA');
    await bdslaToken.approve(sla.address, stakeAmountTimesWei(2), {
      from: notOwner,
    });
    await sla.stakeTokens(stakeAmountTimesWei(2), bdslaToken.address, {
      from: notOwner,
    });

    console.log('Starting automated job 4: Request Analytics and SLI for period 0');
    const networkAnalytics = await NetworkAnalytics.deployed();
    const ownerApproval = true;
    networkAnalytics.requestAnalytics(
      0,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');
    await slaRegistry.requestSLI(0, sla.address, ownerApproval);
    await eventListener(sla, 'SLICreated');

    console.log('Starting automated job 4: Request Analytics and SLI for period 1');
    networkAnalytics.requestAnalytics(
      1,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');
    await slaRegistry.requestSLI(1, sla.address, ownerApproval);
    await eventListener(sla, 'SLICreated');

    console.log('Starting automated job 4: Request Analytics for period 2');
    networkAnalytics.requestAnalytics(
      2,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');

    console.log('Starting automated job 4: Request Analytics for period 3');
    networkAnalytics.requestAnalytics(
      3,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');

    callback(null);
  } catch (error) {
    callback(error);
  }
};
