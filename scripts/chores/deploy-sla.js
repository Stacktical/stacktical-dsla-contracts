const { Account, Wallet } = require('@harmony-js/account');
const { Messenger, HttpProvider } = require('@harmony-js/network');
const { ChainType, ChainID } = require('@harmony-js/utils');
const { SENetworkNamesBytes32, SENetworkNames, SENetworks } = require('../../constants');
const { networkNames } = require('../../environments');
const { getIPFSHash } = require('../../utils');

const { toWei, fromWei } = web3.utils;

const StakeRegistry = artifacts.require('StakeRegistry');
const IERC20 = artifacts.require('IERC20');
const SLARegistry = artifacts.require('SLARegistry');
const SEMessenger = artifacts.require('SEMessenger');
const bDSLA = artifacts.require('bDSLA');
const SLA = artifacts.require('SLA');
const initialTokenSupply = '10000000';
const stakeAmount = initialTokenSupply / 100;
const stakeAmountTimesWei = (times) => toWei(String(stakeAmount * times));
const sloValue = 100 * 10 ** 3;
const sloType = 4;
const periodType = 2;
const slaNetworkBytes32 = SENetworkNamesBytes32[0];
const slaNetwork = SENetworkNames[0];

const getHarmonyAccounts = async () => {
  // const wallet = new Wallet(
  //   new Messenger(
  //     new HttpProvider('https://api.s0.b.hmny.io'),
  //     ChainType.Harmony,
  //     ChainID.HmyTestnet,
  //   ),
  // );
  // wallet.addByMnemonic(
  //   process.env.NODE_ENV === networkNames.HARMONYTESTNET
  //     ? process.env.HARMONY_TESTNET_MNEMONIC
  //     : '',
  // );
  // await wallet.createAccount();
  const [owner] = await web3.eth.getAccounts();
  return [owner, owner];
};

module.exports = async (callback) => {
  try {
    console.log('Starting SLA deployment process');
    console.log('Starting process 1: Allowance on Stake registry to deploy SLA');
    const initialPeriodId = 0;
    const finalPeriodId = 0;
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
    const leverage = 10;
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
      leverage,
    );

    const accounts = process.env.NODE_ENV === networkNames.HARMONYTESTNET
      ? await getHarmonyAccounts()
      : await web3.eth.getAccounts();
    const [owner, notOwner] = accounts;
    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
    console.log(`SLA address: ${slaAddresses[slaAddresses.length - 1]}`);

    await sla.addAllowedTokens(bdslaToken.address);

    console.log('Starting process 3: Stake on owner and notOwner pools');

    const ownerStake = stakeAmountTimesWei(30);
    console.log(`Starting process 3.1: owner: ${fromWei(ownerStake)} bDSLA`);
    await bdslaToken.approve(sla.address, ownerStake);
    await sla.stakeTokens(ownerStake, bdslaToken.address);

    const notOwnerStake = stakeAmountTimesWei(2);
    console.log(`Starting process 3.2: notOwner: ${fromWei(notOwnerStake)} bDSLA`);
    await bdslaToken.approve(sla.address, notOwnerStake, {
      from: notOwner,
    });
    await sla.stakeTokens(notOwnerStake, bdslaToken.address, {
      from: notOwner,
    });

    // const bdslaDPTokenAddress = await sla.dpTokenRegistry(bdslaToken.address);
    // const bdslaDPToken = await IERC20.at(bdslaDPTokenAddress);
    // await bdslaDPToken.approve(sla.address, ownerStake);
    // await sla.withdrawProviderTokens(stakeAmountTimesWei(11), bdslaToken.address);

    callback(null);
  } catch (error) {
    callback(error);
  }
};
