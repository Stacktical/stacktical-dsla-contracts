import { expectRevert } from '@openzeppelin/test-helpers';
import { expect } from 'chai';
import { networkNames, networkNamesBytes32, networks } from '../constants';
import getIPFSHash from './helpers/getIPFSHash';

const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const SEMessenger = artifacts.require('SEMessenger');
const bDSLAToken = artifacts.require('bDSLAToken');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');

const { toWei } = web3.utils;

const initialTokenSupply = '100';
const sloValue = 95000;
const sloType = 4;
const slaNetwork = networkNames[0];
const slaNetworkBytes32 = networkNamesBytes32[0];

// 2 is Weekly SLA
const periodType = 2;

describe('SLA', () => {
  // Addresses
  let owner;
  let notOwner;
  // Tokens
  let bDSLA;
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
    bDSLA = await bDSLAToken.deployed();
    await bDSLA.mint(owner, toWei(initialTokenSupply));
    usdc = await USDC.deployed(); // to simulate a new token
    await usdc.mint(owner, toWei(initialTokenSupply));
    dai = await DAI.deployed();
    await dai.mint(owner, toWei(initialTokenSupply));

    // mint to notOwner
    await bDSLA.mint(notOwner, toWei(initialTokenSupply));
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
      slaNetworkBytes32,
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
  });

  it('should register owner as the SLA contract owner', async () => {
    const contractOwner = await sla.owner.call();
    assert.equal(
      contractOwner,
      owner,
      'owner does not match with the deployer account',
    );
  });

  // it('should return getDetails correctly', async () => {
  //   const slaDetails = await sla.getDetails();
  //   console.log(slaDetails);
  // });

  describe('Staking', () => {
    it('should revert functions with a not allowed token as parameter', async () => {
      const stakeAmount = toWei(String(initialTokenSupply / 10));
      await expectRevert(
        sla.stakeTokens.call(stakeAmount, usdc.address, {
          from: notOwner,
        }),
        'token is not allowed',
      );
    });

    it('should allow the user to stake DSLA on deployment', async () => {
      const firstTokenAddress = await sla.allowedTokens.call(0);
      assert.equal(
        firstTokenAddress,
        bDSLA.address,
        'bDSLA is not registered as allowed token',
      );
      const bDSLAisAllowed = await sla.isAllowedToken.call(bDSLA.address);
      assert.equal(
        bDSLAisAllowed,
        true,
        'bDSLA is not registered as allowed in the mapping',
      );
      const stakeAmount = toWei(String(initialTokenSupply / 10));
      await bDSLA.approve(sla.address, stakeAmount);
      const allowance = await bDSLA.allowance(owner, sla.address);
      assert.equal(
        allowance.toString(),
        stakeAmount,
        'allowance does not match',
      );
      await sla.stakeTokens(stakeAmount, bDSLA.address);
      const userStakesLength = await sla.getTokenStakeLength.call(owner);
      assert.equal(
        userStakesLength,
        1,
        'userStakes has not increased in length',
      );
      const { tokenAddress, stake } = await sla.userStakes.call(owner, 0);
      assert.equal(
        tokenAddress,
        bDSLA.address,
        'token address does not match with bDSLA',
      );
      assert.equal(stake, stakeAmount, 'stakes amount does not match');
      const bDSLAIndex = await sla.userStakedTokensIndex.call(
        owner,
        bDSLA.address,
      );
      assert.equal(bDSLAIndex, 0, 'bDSLA index should be 0');
      const userHasBDSLAstaked = await sla.userStakedTokens.call(
        owner,
        bDSLA.address,
      );
      assert.equal(
        userHasBDSLAstaked,
        true,
        'bDSLA was not correctly registered',
      );
    });

    it('should let the owner to add tokens to the SLA', async () => {
      let usdcIsAllowed = await sla.allowedTokensMapping.call(
        usdc.address,
      );
      assert.equal(
        usdcIsAllowed,
        false,
        'usdc should not be registered as allowed in the mapping',
      );

      await sla.addAllowedTokens(usdc.address);
      usdcIsAllowed = await sla.allowedTokensMapping.call(usdc.address);
      assert.equal(
        usdcIsAllowed,
        true,
        'usdc should be registered as allowed in the mapping',
      );

      const stakeAmount = toWei(String(initialTokenSupply / 10));
      const periodId = 0;

      await usdc.approve(sla.address, stakeAmount);
      await sla.stakeTokens(stakeAmount, usdc.address, periodId);
      const userStakesLength = await sla.getTokenStakeLength.call(owner);
      assert.equal(
        userStakesLength,
        1,
        'userStakes has not increased in length',
      );

      const { tokenAddress, stake } = await sla.userStakes.call(owner, 0);
      assert.equal(
        tokenAddress,
        usdc.address,
        'token address does not match with usdc',
      );

      assert.equal(stake, stakeAmount, 'stakes amount does not match');
      const usdcIndex = await sla.userStakedTokensIndex.call(
        owner,
        usdc.address,
      );

      assert.equal(usdcIndex, 0, 'usdc index should be 0');
      const userHasNewTokenStaked = await sla.userStakedTokens.call(
        owner,
        usdc.address,
      );

      assert.equal(
        userHasNewTokenStaked,
        true,
        'newToken was not correctly registered',
      );
    });

    it('should add stakes per token properly', async () => {
      const periodId = 0;
      const stakeAmount = toWei(String(initialTokenSupply / 10));
      // approve and stake 2 times the same amount
      await bDSLA.approve(sla.address, stakeAmount);
      await sla.stakeTokens(stakeAmount, bDSLA.address, periodId);
      await bDSLA.approve(sla.address, stakeAmount);
      await sla.stakeTokens(stakeAmount, bDSLA.address, periodId);

      const bDSLAStakingIndex = Number(
        await sla.userStakedTokensIndex.call(owner, bDSLA.address),
      );
      expect(bDSLAStakingIndex).to.equal(0);

      let stake = await sla.userStakes.call(owner, bDSLAStakingIndex);
      expect(stake.stake.toString()).to.equal(String(stakeAmount * 2));

      // stake DAI and check the stakes state
      await dai.approve(sla.address, stakeAmount);
      await sla.stakeTokens(stakeAmount, dai.address, periodId);
      // bDSLA stake should not change
      stake = await sla.userStakes.call(owner, bDSLAStakingIndex);
      expect(stake.stake.toString()).to.equal(String(stakeAmount * 2));

      // DAI stake should be stakeAmount
      const daiStakingIndex = Number(
        await sla.userStakedTokensIndex.call(owner, dai.address),
      );
      expect(daiStakingIndex).to.equal(1);

      stake = await sla.userStakes.call(owner, daiStakingIndex);
      expect(stake.stake.toString()).to.equal(String(stakeAmount));

      // stake from notOwner
      await dai.approve(sla.address, stakeAmount, { from: notOwner });
      await sla.stakeTokens(stakeAmount, dai.address, periodId, {
        from: notOwner,
      });
      await bDSLA.approve(sla.address, stakeAmount, { from: notOwner });
      await sla.stakeTokens(stakeAmount, bDSLA.address, periodId, {
        from: notOwner,
      });

      // check from "big totals"
      const daiStake = await sla.tokensPool.call(dai.address);
      const bDSLAStake = await sla.tokensPool.call(bDSLA.address);
      const newTokenStake = await sla.tokensPool.call(usdc.address);
      expect(daiStake.toString()).to.equal(String(2 * stakeAmount));
      expect(bDSLAStake.toString()).to.equal(String(3 * stakeAmount));
      expect(newTokenStake.toString()).to.equal(String(0 * stakeAmount));

      // withdraw some stakes
      await sla.withdraw(dai.address, periodId, { from: notOwner });
      await sla.withdraw(bDSLA.address, periodId, { from: notOwner });
      const daiStake2 = await sla.tokensPool.call(dai.address);
      const bDSLAStake2 = await sla.tokensPool.call(bDSLA.address);
      // notOwner has staked 1*stakeAmount of bDSLA and 1*stakeAmount of DAI
      expect(daiStake2.toString()).to.equal(String(1 * stakeAmount));
      expect(bDSLAStake2.toString()).to.equal(String(2 * stakeAmount));

      // check owner stakes
    });
  });
});
