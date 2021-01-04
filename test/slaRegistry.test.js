import { expect } from 'chai';

const IERC20 = artifacts.require('IERC20');
const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const Messenger = artifacts.require('Messenger');
const bDSLAToken = artifacts.require('bDSLAToken');
const DAI = artifacts.require('DAI');

const { slaConstructor } = require('./helpers/constants');
const { getSLI, eventListener, cleanSolidityString } = require('./helpers');
const { testEnv } = require('../environments.config');

const { toWei, utf8ToHex } = web3.utils;

const initialTokenSupply = '100';
const stakeAmount1 = toWei(String(initialTokenSupply / 10));
const stakeAmount2 = toWei(String(initialTokenSupply / 5));
const periodId = 0;
const sloValue = 95000;
const sloType = 4;
const sloName = utf8ToHex('staking_efficiency');

describe('SLARegistry', () => {
  let owner;
  let bDSLA;
  let newToken;
  let messenger;
  let slaRegistry;
  let chainlinkToken;
  let sloRegistry;
  let userSlos;
  let dai;
  const SLAs = [];

  beforeEach(async () => {
    SLAs.length = 0;
    const accounts = await web3.eth.getAccounts();
    [owner] = accounts;

    bDSLA = await bDSLAToken.new();
    await bDSLA.mint(owner, toWei(initialTokenSupply));

    dai = await DAI.new();
    await dai.mint(owner, toWei(initialTokenSupply));

    newToken = await bDSLAToken.new(); // to simulate a new token
    await newToken.mint(owner, toWei(initialTokenSupply));

    messenger = await Messenger.new(
      testEnv.chainlinkOracleAddress,
      testEnv.chainlinkTokenAddress,
      testEnv.chainlinkJobId,
    );

    chainlinkToken = await IERC20.at(testEnv.chainlinkTokenAddress);

    slaRegistry = await SLARegistry.new(messenger.address);

    sloRegistry = await SLORegistry.new();
    // 4 is "GreatherThan"
    await sloRegistry.createSLO(sloValue, sloType, sloName);
    userSlos = await sloRegistry.userSLOs.call(owner);

    // Register the SLAs
    const {
      _stake,
      _ipfsHash,
      _sliInterval,
      _sla_period_starts,
      _sla_period_ends,
    } = slaConstructor;

    await slaRegistry.createSLA(
      owner,
      [sloName],
      userSlos,
      _stake,
      _ipfsHash,
      _sliInterval,
      bDSLA.address,
      _sla_period_starts,
      _sla_period_ends,
      { from: owner },
    );

    await slaRegistry.createSLA(
      owner,
      [sloName],
      userSlos,
      _stake,
      _ipfsHash,
      _sliInterval,
      bDSLA.address,
      _sla_period_starts,
      _sla_period_ends,
      { from: owner },
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[0]);
    SLAs.push(sla);
  });

  it('should ask for active pool correctly', async () => {
    const [sla] = SLAs;
    await bDSLA.approve(sla.address, stakeAmount1);
    await sla.addAllowedTokens(dai.address);
    await dai.approve(sla.address, stakeAmount2);
    await sla.stakeTokens(stakeAmount1, bDSLA.address, periodId);
    await sla.stakeTokens(stakeAmount2, dai.address, periodId);

    const activePools = await slaRegistry.getActivePool.call(owner);
    assert.equal(
      activePools.length,
      2,
      'active pools should only be equal to SLAs length',
    );

    const [pool1, pool2] = activePools;
    const bDSLAName = await bDSLA.name.call();
    const daiName = await dai.name.call();

    assert.equal(pool1.stake, stakeAmount1, 'stakes for SLA 1 does not match');
    assert.equal(pool2.stake, stakeAmount2, 'stakes for SLA 2 does not match');
    assert.equal(
      cleanSolidityString(pool1.assetName),
      bDSLAName,
      'names for SLA 1 does not match',
    );
    assert.equal(
      cleanSolidityString(pool2.assetName),
      daiName,
      'names for SLA 2 does not match',
    );
    assert.equal(
      pool1.SLAaddress,
      sla.address,
      'addresses for pool 1 does not match',
    );
    assert.equal(
      pool2.SLAaddress,
      sla.address,
      'addresses for pool 2 does not match',
    );
  });

  it('should ask for a SLI and check the SLO status properly', async () => {
    const SLICreatedEvent = 'SLICreated';
    const [sla] = SLAs;
    const { _sla_period_starts, _sla_period_ends } = slaConstructor;
    const periodStart = _sla_period_starts[periodId];
    const periodEnd = _sla_period_ends[periodId];

    // Fund the messenger contract with LINK
    await chainlinkToken.transfer(messenger.address, web3.utils.toWei('0.1'));
    await slaRegistry.requestSLI(periodId, sla.address, sloName);
    const eventDetected = await eventListener(sla, SLICreatedEvent);
    const expectedSLI1 = await getSLI(sla.address, periodStart, periodEnd);
    const expectedResponse = {
      name: SLICreatedEvent,
      values: {
        _value: String(expectedSLI1 * 1000),
        _periodId: String(periodId),
      },
    };
    expect(eventDetected.name).to.equal(expectedResponse.name);
    expect(eventDetected.values).to.include(expectedResponse.values);
    const { status } = await sla.periods.call(periodId);
    // 1 is Respected. Is expected to be 1 because the sloType is 4 "GreaterThan"
    // and the production API is returning 100
    expect(status.toString()).to.equal('1');
  });
});
