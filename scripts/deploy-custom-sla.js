const { networkNamesBytes32, networkNames, networks } = require('../constants');
const { getIPFSHash, eventListener } = require('../test/helpers');

const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const SEMessenger = artifacts.require('SEMessenger');
const StakeRegistry = artifacts.require('StakeRegistry');
const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');
const { toWei } = web3.utils;
const initialTokenSupply = '1000000';

const stakeAmount = initialTokenSupply / 100;
const stakeAmountWei = toWei(String(stakeAmount));
const sloValue = 85000;
const sloType = 4;
const periodType = 2;
const slaNetworkBytes32 = networkNamesBytes32[0];
const slaNetwork = networkNames[0];

module.exports = async (callback) => {
  try {
    const [owner, notOwner] = await web3.eth.getAccounts();

    const bdslaToken = await bDSLA.deployed();
    const daiToken = await DAI.deployed();
    const usdcToken = await USDC.deployed();
    const slaRegistry = await SLARegistry.deployed();
    const sloRegistry = await SLORegistry.deployed();
    const seMessenger = await SEMessenger.deployed();
    const stakeRegistry = await StakeRegistry.deployed();

    const slo = await sloRegistry.sloAddresses.call(sloValue, sloType);
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
    const periodIds = [0, 1, 2];
    const dslaDepositByPeriod = toWei(String(20000 * periodIds.length));
    await bdslaToken.approve(stakeRegistry.address, dslaDepositByPeriod);
    await slaRegistry.createSLA(
      slo,
      ipfsHash,
      periodType,
      periodIds,
      seMessenger.address,
      false,
      [slaNetworkBytes32],
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
    console.log(`Starting automated jobs for SLA: ${sla.address}`);
    console.log('Starting automated job 1: Adding bDSLA, DAI and USDC tokens as allowed to SLA contract');
    await sla.addAllowedTokens(bdslaToken.address);
    await sla.addAllowedTokens(daiToken.address);
    await sla.addAllowedTokens(usdcToken.address);

    console.log('Starting automated job 2: Stake on owner and notOwner pools');
    console.log('Starting automated job 2.1: owner: 30000 bDSLA, 30000 DAI, 30000 USDC');
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
    // 3 * bdsla + 2 * dai
    console.log('Starting automated job 2.2: notOwner: 0 bDSLA, 20000 DAI, 30000 USDC');
    await bdslaToken.approve(sla.address, stakeAmountWei, { from: notOwner });
    await sla.stakeTokens(stakeAmountWei, bdslaToken.address, { from: notOwner });
    await bdslaToken.approve(sla.address, stakeAmountWei, { from: notOwner });
    await sla.stakeTokens(stakeAmountWei, bdslaToken.address, { from: notOwner });
    await bdslaToken.approve(sla.address, stakeAmountWei, { from: notOwner });
    await sla.stakeTokens(stakeAmountWei, bdslaToken.address, { from: notOwner });
    await daiToken.approve(sla.address, stakeAmountWei, { from: notOwner });
    await sla.stakeTokens(stakeAmountWei, daiToken.address, { from: notOwner });
    await daiToken.approve(sla.address, stakeAmountWei, { from: notOwner });
    await sla.stakeTokens(stakeAmountWei, daiToken.address, { from: notOwner });

    // periods 0 is already finished
    console.log('Starting automated job 3: Request SLI for period 0');
    await slaRegistry.requestSLI(0, sla.address);
    await eventListener(sla, 'SLICreated');

    // periods 1 is already finished
    console.log('Starting automated job 4: Request SLI for period 1');
    await slaRegistry.requestSLI(1, sla.address);
    await eventListener(sla, 'SLICreated');

    callback(null);
  } catch (error) {
    callback(error);
  }
};
