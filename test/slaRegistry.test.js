import { expect } from 'chai';
import { expectRevert } from '@openzeppelin/test-helpers';
import { needsGetJobId } from '../environments';
import {
  getChainlinkJobId,
  waitBlockTimestamp,
  generatePeriods,
  eventListener,
  cleanSolidityString,
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
const DAI = artifacts.require('DAI');

const { envParameters } = require('../environments');

const { toWei, utf8ToHex } = web3.utils;

const initialTokenSupply = '100';
const stakeAmount1 = toWei(String(initialTokenSupply / 10));
const stakeAmount2 = toWei(String(initialTokenSupply / 5));
const periodId = 0;
const sloValue = 95000;
const sloType = 4;
const sloName = utf8ToHex('staking_efficiency');

// 2 is Weekly SLA
const periodType = 2;
const apy = 13;
const yearlyPeriods = 52;
const [periodStarts, periodEnds] = generatePeriods(10);
const slaNetwork = networkNames[0];
const slaNetworkBytes32 = networkNamesBytes32[0];

describe('SLARegistry', () => {
  let owner;
  let notOwner;
  let bDSLA;
  let newToken;
  let stakingEfficiencyMessenger;
  let slaRegistry;
  let chainlinkToken;
  let sloRegistry;
  let periodRegistry;
  let messengerRegistry;
  let stakeRegistry;
  let networkAnalytics;
  let slo;
  let dai;
  let ipfsHash;
  const SLAs = [];

  before(async () => {
    // deploy tokens
    bDSLA = await bDSLAToken.new();
    dai = await DAI.new();
    newToken = await bDSLAToken.new(); // to simulate a new token
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
      apy,
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
  });

  beforeEach(async () => {
    SLAs.length = 0;

    // mint to owner
    await bDSLA.mint(owner, toWei(initialTokenSupply));
    await dai.mint(owner, toWei(initialTokenSupply));
    await newToken.mint(owner, toWei(initialTokenSupply));

    // mint to notOwner
    await bDSLA.mint(notOwner, toWei(initialTokenSupply), { from: notOwner });
    await dai.mint(notOwner, toWei(initialTokenSupply), { from: notOwner });
    await newToken.mint(notOwner, toWei(initialTokenSupply), {
      from: notOwner,
    });

    stakingEfficiencyMessenger = await StakingEfficiency.new(
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      !needsGetJobId ? envParameters.chainlinkJobId : await getChainlinkJobId(),
      networkAnalytics.address,
    );

    chainlinkToken = await IERC20.at(envParameters.chainlinkTokenAddress);

    slaRegistry = await SLARegistry.new(
      sloRegistry.address,
      periodRegistry.address,
      messengerRegistry.address,
      stakeRegistry.address,
    );

    await slaRegistry.setMessengerSLARegistryAddress(
      stakingEfficiencyMessenger.address,
    );

    await slaRegistry.createSLA(
      slo,
      ipfsHash,
      periodType,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      stakingEfficiencyMessenger.address,
      false,
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[0]);
    SLAs.push(sla);
  });

  it('should ask for a SLI and check the SLO status properly', async () => {
    const SLICreatedEvent = 'SLICreated';
    const AnalyticsReceivedEvent = 'AnalyticsReceived';
    const [sla] = SLAs;

    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      networkAnalytics.address,
      web3.utils.toWei('0.1'),
    );

    await networkAnalytics.requestAnalytics(periodId, periodType, slaNetworkBytes32);
    await eventListener(networkAnalytics, AnalyticsReceivedEvent);

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

  it('requestSLI can be called only once', async () => {
    const SLICreatedEvent = 'SLICreated';
    const [sla] = SLAs;

    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );
    await slaRegistry.requestSLI(periodId, sla.address, sloName);
    await eventListener(sla, SLICreatedEvent);

    // call for second time
    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );
    await expectRevert(
      slaRegistry.requestSLI.call(periodId, sla.address, sloName),
      'SLA contract was already verified for the period',
    );
    // await slaRegistry.requestSLI(periodId, sla.address, sloName);
  });

  it('requestSLI can only be called if the period is finished', async () => {
    const SLICreatedEvent = 'SLICreated';

    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      stakingEfficiencyMessenger.address,
      web3.utils.toWei('0.1'),
    );

    const { timestamp: currentBlockTimestamp } = await web3.eth.getBlock(
      'latest',
    );
    // add 15 seconds to fail first transaction
    const slaPeriodEnd = currentBlockTimestamp + 15;
    slaRegistry.createSLA(
      owner,
      [sloName],
      slo,
      0,
      ipfsHash,
      bDSLA.address,
      [currentBlockTimestamp],
      [slaPeriodEnd],
      { from: owner },
    );
    const {
      values: { sla: slaAddress },
    } = await eventListener(slaRegistry, 'SLACreated');

    await expectRevert(
      slaRegistry.requestSLI.call(periodId, slaAddress, sloName),
      'SLA contract period has not finished yet',
    );

    // Wait for the correct block timestamp to execute the requestSLI function
    await waitBlockTimestamp(slaPeriodEnd);
    await slaRegistry.requestSLI(periodId, slaAddress, sloName);
    await eventListener(await SLA.at(slaAddress), SLICreatedEvent);
  });
});
