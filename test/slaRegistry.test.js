import { expect } from 'chai';
import { expectRevert } from '@openzeppelin/test-helpers';
import { needsGetJobId } from '../environments';
import {
  getChainlinkJobId,
  waitBlockTimestamp,
  generatePeriods,
  eventListener,
} from './helpers';
import { networkNamesBytes32, networkNames, networks } from '../constants';
import getIPFSHash from './helpers/getIPFSHash';
import { getSLI } from './helpers/getSLI';

const IERC20 = artifacts.require('IERC20');
const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const StakingEfficiency = artifacts.require('StakingEfficiency');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const bDSLAToken = artifacts.require('bDSLAToken');

const { envParameters } = require('../environments');

const { utf8ToHex } = web3.utils;

const periodId = 0;
const sloValue = 95000;
const sloType = 4;
const sloName = utf8ToHex('staking_efficiency');

// 2 is Weekly SLA
const periodType = 2;
const yearlyPeriods = 52;
const [periodStarts, periodEnds] = generatePeriods(10);
const slaNetwork = networkNames[0];
const slaNetworkBytes32 = networkNamesBytes32[0];

describe('SLARegistry', () => {
  let owner;
  let notOwner;
  let bDSLA;
  let stakingEfficiencyMessenger;
  let slaRegistry;
  let chainlinkToken;
  let sloRegistry;
  let periodRegistry;
  let messengerRegistry;
  let stakeRegistry;
  let networkAnalytics;
  let slo;
  let ipfsHash;
  let sla;

  before(async () => {
    // deploy tokens
    bDSLA = await bDSLAToken.new();
    const serviceMetadata = {
      serviceName: networks[slaNetwork].validators[0],
      serviceDescription: 'Official DSLA Beta Partner.',
      serviceImage:
        'https://storage.googleapis.com/dsla-incentivized-beta/validators/chainode.svg',
      serviceURL: 'https://dsla.network',
      serviceAddress: 'one18hum2avunkz3u448lftwmk7wr88qswdlfvvrdm',
      serviceTicker: slaNetwork,
    };

    ipfsHash = await getIPFSHash(serviceMetadata);
    [owner, notOwner] = await web3.eth.getAccounts();

    sloRegistry = await SLORegistry.new();
    // 4 is "GreatherThan"
    await sloRegistry.createSLO(sloValue, sloType, sloName);
    [slo] = await sloRegistry.userSLOs.call(owner);
    periodRegistry = await PeriodRegistry.new();
    await periodRegistry.initializePeriod(
      periodType,
      periodStarts,
      periodEnds,
      yearlyPeriods,
    );
    messengerRegistry = await MessengerRegistry.new();
    stakeRegistry = await StakeRegistry.new(bDSLA.address);

    networkAnalytics = await NetworkAnalytics.new(
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      !needsGetJobId ? envParameters.chainlinkJobId : await getChainlinkJobId(),
      periodRegistry.address,
    );

    await networkAnalytics.addNetwork(slaNetworkBytes32);

    const AnalyticsReceivedEvent = 'AnalyticsReceived';
    chainlinkToken = await IERC20.at(envParameters.chainlinkTokenAddress);
    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      networkAnalytics.address,
      web3.utils.toWei('0.1'),
    );

    await networkAnalytics.requestAnalytics(
      periodId,
      periodType,
      slaNetworkBytes32,
    );
    await eventListener(networkAnalytics, AnalyticsReceivedEvent);
    stakingEfficiencyMessenger = await StakingEfficiency.new(
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      !needsGetJobId ? envParameters.chainlinkJobId : await getChainlinkJobId(),
      networkAnalytics.address,
    );

    slaRegistry = await SLARegistry.new(
      sloRegistry.address,
      periodRegistry.address,
      messengerRegistry.address,
      stakeRegistry.address,
    );

    stakingEfficiencyMessenger = await StakingEfficiency.new(
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      !needsGetJobId ? envParameters.chainlinkJobId : await getChainlinkJobId(),
      networkAnalytics.address,
    );

    await slaRegistry.setMessengerSLARegistryAddress(
      stakingEfficiencyMessenger.address,
    );
  });

  beforeEach(async () => {
    await slaRegistry.createSLA(
      slo,
      ipfsHash,
      periodType,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      stakingEfficiencyMessenger.address,
      false,
      slaNetworkBytes32,
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
  });

  it('should ask for a SLI and check the SLO status properly', async () => {
    const SLICreatedEvent = 'SLICreated';

    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );

    await slaRegistry.requestSLI(periodId, sla.address);
    const { name, values } = await eventListener(sla, SLICreatedEvent);
    const expectedSLI1 = await getSLI(
      sla.address,
      periodId,
      networkAnalytics.address,
    );
    const expectedResponse = {
      name: SLICreatedEvent,
      values: {
        _sli: String(expectedSLI1),
        _periodId: String(periodId),
      },
    };
    expect(name).to.equal(expectedResponse.name);
    expect(values).to.include(expectedResponse.values);
    const { status } = await sla.slaPeriods.call(periodId);
    // 1 is Respected, 2 NotRespected
    // eslint-disable-next-line no-underscore-dangle
    const sloRespected = sloValue < values._value;
    expect(status.toString()).to.equal(sloRespected ? '1' : '2');
  });

  it('requestSLI can be called only after the network analytics object was stored', async () => {
    const networkName = networkNames[1];
    const serviceMetadata = {
      serviceName: networks[networkName].validators[0],
      serviceDescription: 'Official DSLA Beta Partner.',
      serviceImage:
        'https://storage.googleapis.com/dsla-incentivized-beta/validators/chainode.svg',
      serviceURL: 'https://dsla.network',
      serviceAddress: 'one18hum2avunkz3u448lftwmk7wr88qswdlfvvrdm',
      serviceTicker: networkName,
    };

    const newIpfsHash = await getIPFSHash(serviceMetadata);
    const networkBytesName = networkNamesBytes32[1];
    await slaRegistry.createSLA(
      slo,
      newIpfsHash,
      periodType,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      stakingEfficiencyMessenger.address,
      false,
      networkBytesName,
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);

    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );

    await expectRevert(
      slaRegistry.requestSLI.call(periodId, sla.address),
      'Network analytics object is not assigned yet',
    );

    await chainlinkToken.transfer(
      networkAnalytics.address,
      web3.utils.toWei('0.1'),
    );
    await networkAnalytics.addNetwork(networkBytesName);
    // request the network analytics object
    const AnalyticsReceivedEvent = 'AnalyticsReceived';
    await networkAnalytics.requestAnalytics(
      periodId,
      periodType,
      networkBytesName,
    );
    await eventListener(networkAnalytics, AnalyticsReceivedEvent);

    slaRegistry.requestSLI(periodId, sla.address);
    await eventListener(sla, 'SLICreated');
  });

  it('requestSLI can be called only once', async () => {
    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );
    slaRegistry.requestSLI(periodId, sla.address);
    await eventListener(sla, 'SLICreated');

    // call for second time
    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );
    await expectRevert(
      slaRegistry.requestSLI.call(periodId, sla.address),
      'SLA contract was already verified for the period',
    );
  });

  it('requestSLI can only be called if the period is finished', async () => {
    const networkBytesName = networkNamesBytes32[0];
    const { timestamp: currentBlockTimestamp } = await web3.eth.getBlock(
      'latest',
    );
    // add 15 seconds to fail first transaction
    const slaPeriodEnd = currentBlockTimestamp + 15;
    // initialize the hourly period for testing
    await periodRegistry.initializePeriod(
      // 0 is hourly
      0,
      [currentBlockTimestamp],
      [slaPeriodEnd],
      yearlyPeriods,
    );

    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );

    await slaRegistry.createSLA(
      slo,
      ipfsHash,
      // 0 is hourly
      0,
      [0],
      stakingEfficiencyMessenger.address,
      false,
      networkBytesName,
    );
    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);

    await expectRevert(
      slaRegistry.requestSLI.call(periodId, sla.address),
      'SLA contract period has not finished yet',
    );

    // Wait for the correct block timestamp to execute the requestSLI function
    await waitBlockTimestamp(slaPeriodEnd);

    await chainlinkToken.transfer(
      networkAnalytics.address,
      web3.utils.toWei('0.1'),
    );
    // request the network analytics object
    const AnalyticsReceivedEvent = 'AnalyticsReceived';
    // period 0, periodType 0
    await networkAnalytics.requestAnalytics(
      0,
      0,
      networkBytesName,
    );
    await eventListener(networkAnalytics, AnalyticsReceivedEvent);

    await slaRegistry.requestSLI(periodId, sla.address);
    await eventListener(sla, 'SLICreated');
  });
});
