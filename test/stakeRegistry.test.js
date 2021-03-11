import { expect } from 'chai';
import { cleanSolidityString } from './helpers';
import { networkNames, networkNamesBytes32, networks } from '../constants';
import getIPFSHash from './helpers/getIPFSHash';

const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');
const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const SEMessenger = artifacts.require('SEMessenger');

const { toWei } = web3.utils;

const initialTokenSupply = '100';
const stakeAmount1 = toWei(String(initialTokenSupply / 10));
const stakeAmount2 = toWei(String(initialTokenSupply / 5));

const sloValue = 95000;
const sloType = 4;

// 2 is Weekly SLA
const periodType = 2;
const slaNetwork = networkNames[0];
const slaNetworkBytes32 = networkNamesBytes32[0];

describe('StakeRegistry', () => {
  // Addresses
  let owner;
  let notOwner;
  // Tokens
  let bdsla;
  let dai;
  let usdc;
  let seMessenger;
  let stakeRegistry;
  let slaRegistry;
  let slo;
  let sla;
  let ipfsHash;

  before(async () => {
    [owner, notOwner] = await web3.eth.getAccounts();
    bdsla = await bDSLA.deployed();
    await bdsla.mint(owner, toWei(initialTokenSupply));
    usdc = await USDC.deployed(); // to simulate a new token
    await usdc.mint(owner, toWei(initialTokenSupply));
    dai = await DAI.deployed();
    await dai.mint(owner, toWei(initialTokenSupply));

    // mint to notOwner
    await bdsla.mint(notOwner, toWei(initialTokenSupply));
    await usdc.mint(notOwner, toWei(initialTokenSupply));
    await dai.mint(notOwner, toWei(initialTokenSupply));

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
    const sloRegistry = await SLORegistry.deployed();
    // 4 is "GreatherThan"
    slo = await sloRegistry.sloAddresses.call(sloValue, sloType);

    stakeRegistry = await StakeRegistry.deployed();
    await stakeRegistry.addAllowedTokens(dai.address);
    await stakeRegistry.addAllowedTokens(usdc.address);

    seMessenger = await SEMessenger.deployed();
    slaRegistry = await SLARegistry.deployed();
  });

  beforeEach(async () => {
    // Register the SLA

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

  it('should ask for active pool correctly', async () => {
    await sla.addAllowedTokens(dai.address);

    // with owner
    await bdsla.approve(sla.address, stakeAmount1);
    await dai.approve(sla.address, stakeAmount2);
    await sla.stakeTokens(stakeAmount1, bdsla.address);
    await sla.stakeTokens(stakeAmount2, dai.address);

    const slaStakedByOwner = await stakeRegistry.slaWasStakedByUser(
      owner,
      sla.address,
    );
    // eslint-disable-next-line no-unused-expressions
    expect(slaStakedByOwner).to.be.true;

    let activePools = await stakeRegistry.getActivePool.call(owner);
    assert.equal(
      activePools.length,
      2,
      'active pools should only be equal to SLAs length',
    );

    let [pool1, pool2] = activePools;
    let bDSLAName = await bdsla.name.call();
    let daiName = await dai.name.call();

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
      pool1.SLAAddress,
      sla.address,
      'addresses for pool 1 does not match',
    );
    assert.equal(
      pool2.SLAAddress,
      sla.address,
      'addresses for pool 2 does not match',
    );

    // with notOwner
    await bdsla.approve(sla.address, stakeAmount1, { from: notOwner });
    await dai.approve(sla.address, stakeAmount2, { from: notOwner });
    await sla.stakeTokens(stakeAmount1, bdsla.address, {
      from: notOwner,
    });
    await sla.stakeTokens(stakeAmount2, dai.address, {
      from: notOwner,
    });

    // for notOwner
    activePools = await stakeRegistry.getActivePool.call(notOwner);
    assert.equal(
      activePools.length,
      2,
      'active pools should only be equal to SLAs length',
    );
    [pool1, pool2] = activePools;
    bDSLAName = await bdsla.name.call({ from: notOwner });
    daiName = await dai.name.call({ from: notOwner });

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
      pool1.SLAAddress,
      sla.address,
      'addresses for pool 1 does not match',
    );
    assert.equal(
      pool2.SLAAddress,
      sla.address,
      'addresses for pool 2 does not match',
    );
  });
});
