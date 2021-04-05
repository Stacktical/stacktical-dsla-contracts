const { networkNamesBytes32, networkNames, networks } = require('../constants');
const { getIPFSHash, eventListener } = require('../test/helpers');

const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SEMessenger = artifacts.require('SEMessenger');
const StakeRegistry = artifacts.require('StakeRegistry');
const bDSLA = artifacts.require('bDSLA');
const { toWei } = web3.utils;
const initialTokenSupply = '1000000';
const stakeAmount = initialTokenSupply / 100;
const stakeAmountTimesWei = (times) => toWei(String(stakeAmount * times));

const sloValue = 85000;
const sloType = 4;
const periodType = 2;
const slaNetworkBytes32 = networkNamesBytes32[0];
const slaNetwork = networkNames[0];

module.exports = async (callback) => {
  try {
    const [owner, notOwner] = await web3.eth.getAccounts();

    const bdslaToken = await bDSLA.deployed();
    const slaRegistry = await SLARegistry.deployed();
    const seMessenger = await SEMessenger.deployed();
    const stakeRegistry = await StakeRegistry.deployed();

    // Next steps are optional and not required for production (review before copy/paste)
    console.log('Starting automated job 1: Creating SLA');
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
    const initialPeriodId = 0;
    const finalPeriodId = 2;
    const dslaDepositByPeriod = 20000;
    const dslaDeposit = toWei(
      String(dslaDepositByPeriod * (finalPeriodId - initialPeriodId + 1)),
    );
    await bdslaToken.approve(stakeRegistry.address, dslaDeposit);
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

    console.log('Starting automated job 2: Adding bDSLA as allowed to SLA contract');
    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
    await sla.addAllowedTokens(bdslaToken.address);

    console.log('Starting automated job 2: Stake on owner and notOwner pools');
    console.log('Starting automated job 2.1: owner: 30000 bDSLA');
    // Owner
    // 3 * bsdla
    await bdslaToken.approve(sla.address, stakeAmountTimesWei(3));
    await sla.stakeTokens(stakeAmountTimesWei(3), bdslaToken.address);

    // NotOwner
    // 3 * bdsla
    console.log('Starting automated job 2.2: notOwner: 2000 bDSLA');
    await bdslaToken.approve(sla.address, stakeAmountTimesWei(2), { from: notOwner });
    await sla.stakeTokens(stakeAmountTimesWei(2), bdslaToken.address, { from: notOwner });

    // console.log(
    //   'Starting automated job 10: Request Analytics and SLI for period 0',
    // );
    // const ownerApproval = true;

    // await slaRegistry.requestSLI(0, sla.address, ownerApproval);
    // await eventListener(sla, 'SLICreated');

    // console.log(
    //   'Starting automated job 10: Request Analytics and SLI for period 1',
    // );
    // await slaRegistry.requestSLI(1, sla.address, ownerApproval);
    // await eventListener(sla, 'SLICreated');

    callback(null);
  } catch (error) {
    callback(error);
  }
};
