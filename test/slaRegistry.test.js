import { expect } from 'chai';
import { expectRevert } from '@openzeppelin/test-helpers';
import { eventListener, waitBlockTimestamp } from './helpers';
import { networkNames, networkNamesBytes32, networks } from '../constants';
import getIPFSHash from './helpers/getIPFSHash';
import { getSLI } from './helpers/getSLI';

const IERC20 = artifacts.require('IERC20');
const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const SEMessenger = artifacts.require('SEMessenger');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');

const { envParameters } = require('../environments');

const periodId = 0;
const sloValue = 95000;
const sloType = 4;

// 2 is Weekly SLA
const periodType = 2;
const yearlyPeriods = 52;
const slaNetwork = networkNames[0];
const slaNetworkBytes32 = networkNamesBytes32[0];

describe('SLARegistry', () => {
  let owner;
  let seMessenger;
  let slaRegistry;
  let chainlinkToken;
  let periodRegistry;
  let networkAnalytics;
  let slo;
  let ipfsHash;
  let sla;

  before(async () => {
    [owner] = await web3.eth.getAccounts();
    const sloRegistry = await SLORegistry.deployed();
    networkAnalytics = await NetworkAnalytics.deployed();
    periodRegistry = await PeriodRegistry.deployed();
    seMessenger = await SEMessenger.deployed();
    slaRegistry = await SLARegistry.deployed();

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

    // 4 is "GreatherThan"
    slo = await sloRegistry.sloAddresses.call(sloValue, sloType);

    chainlinkToken = await IERC20.at(envParameters.chainlinkTokenAddress);

    await chainlinkToken.transfer(
      networkAnalytics.address,
      web3.utils.toWei('0.1'),
    );

    await networkAnalytics.requestAnalytics(
      periodId,
      periodType,
      slaNetworkBytes32,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');
  });

  beforeEach(async () => {
    await slaRegistry.createSLA(
      slo,
      ipfsHash,
      periodType,
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      seMessenger.address,
      false,
      [slaNetworkBytes32],
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
  });

  it('should ask for a SLI and check the SLO status properly', async () => {
    const SLICreatedEvent = 'SLICreated';

    await chainlinkToken.transfer(
      seMessenger.address,
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
      seMessenger.address,
      false,
      [networkBytesName],
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);

    // Fund the seMessenger contract with LINK
    await chainlinkToken.transfer(
      seMessenger.address,
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
    // Fund the seMessenger contract with LINK
    await chainlinkToken.transfer(
      seMessenger.address,
      web3.utils.toWei('0.1'),
    );
    slaRegistry.requestSLI(periodId, sla.address);
    await eventListener(sla, 'SLICreated');

    // call for second time
    await chainlinkToken.transfer(
      seMessenger.address,
      web3.utils.toWei('0.1'),
    );
    await expectRevert(
      slaRegistry.requestSLI.call(periodId, sla.address),
      'SLA contract was already verified for the period',
    );
  });
  // this tests requires changing the blocktme of ganache on
  // local-env docker-compose file --blockTime=1
  // it.only('requestSLI can only be called if the period is finished', async () => {
  //   const networkBytesName = networkNamesBytes32[0];
  //   const { timestamp: currentBlockTimestamp } = await web3.eth.getBlock(
  //     'latest',
  //   );
  //   // add 15 seconds to fail first transaction
  //   const slaPeriodEnd = currentBlockTimestamp + 15;
  //   // initialize the hourly period for testing
  //   await periodRegistry.initializePeriod(
  //     // 0 is hourly
  //     0,
  //     [currentBlockTimestamp],
  //     [slaPeriodEnd],
  //     yearlyPeriods,
  //   );

  //   // Fund the seMessenger contract with LINK
  //   await chainlinkToken.transfer(
  //     seMessenger.address,
  //     web3.utils.toWei('0.1'),
  //   );

  //   await slaRegistry.createSLA(
  //     slo,
  //     ipfsHash,
  //     // 0 is hourly
  //     0,
  //     [0],
  //     seMessenger.address,
  //     false,
  //     [networkBytesName],
  //   );
  //   const slaAddresses = await slaRegistry.userSLAs(owner);
  //   sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);

  //   await expectRevert(
  //     slaRegistry.requestSLI.call(periodId, sla.address),
  //     'SLA contract period has not finished yet',
  //   );

  //   // Wait for the correct block timestamp to execute the requestSLI function
  //   await waitBlockTimestamp(slaPeriodEnd);

  //   await chainlinkToken.transfer(
  //     networkAnalytics.address,
  //     web3.utils.toWei('0.1'),
  //   );
  //   // request the network analytics object
  //   const AnalyticsReceivedEvent = 'AnalyticsReceived';
  //   // period 0, periodType 0
  //   await networkAnalytics.requestAnalytics(
  //     0,
  //     0,
  //     networkBytesName,
  //   );
  //   await eventListener(networkAnalytics, AnalyticsReceivedEvent);

  //   await slaRegistry.requestSLI(periodId, sla.address);
  //   await eventListener(sla, 'SLICreated');
  // });
});
