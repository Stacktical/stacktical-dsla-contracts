import { expectRevert } from '@openzeppelin/test-helpers';
import { expect } from 'chai';

import { slaConstructor } from './helpers/constants';

const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const Messenger = artifacts.require('Messenger');
const bDSLAToken = artifacts.require('bDSLAToken');
const DAI = artifacts.require('DAI');

const { toWei } = web3.utils;
const { testEnv } = require('../environments.config');

const initialTokenSupply = '100';

describe('SLA', () => {
  let owner;
  let notOwner;
  let notOwners;
  let sla;
  let bDSLA;
  let newToken;
  let messenger;
  let slaRegistry;
  let dai;

  beforeEach(async () => {
    const accounts = await web3.eth.getAccounts();
    [owner, notOwner, ...notOwners] = accounts;

    bDSLA = await bDSLAToken.new();
    await bDSLA.mint(owner, toWei(initialTokenSupply));
    newToken = await bDSLAToken.new(); // to simulate a new token
    await newToken.mint(owner, toWei(initialTokenSupply));
    dai = await DAI.new();
    await dai.mint(owner, toWei(initialTokenSupply));

    // mint to notOwner
    await bDSLA.mint(notOwner, toWei(initialTokenSupply));
    await newToken.mint(notOwner, toWei(initialTokenSupply));
    await dai.mint(notOwner, toWei(initialTokenSupply));

    messenger = await Messenger.new(
      testEnv.chainlinkOracleAddress,
      testEnv.chainlinkTokenAddress,
      testEnv.chainlinkJobId,
    );
    slaRegistry = await SLARegistry.new(messenger.address);

    // Register the SLA
    const {
      _SLONames,
      _SLOs,
      _stake,
      _ipfsHash,
      _sliInterval,
      _sla_period_starts,
      _sla_period_ends,
    } = slaConstructor;
    await slaRegistry.createSLA(
      owner,
      _SLONames,
      _SLOs,
      _stake,
      _ipfsHash,
      _sliInterval,
      bDSLA.address,
      _sla_period_starts,
      _sla_period_ends,
      { from: owner },
    );
    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[0]);

    // allow DAI
    await sla.addAllowedTokens(dai.address);
  });

  it('should register owner as the SLA contract owner', async () => {
    const contractOwner = await sla.owner.call();
    assert.equal(
      contractOwner,
      owner,
      'owner does not match with the deployer account',
    );
  });

  describe('Staking', () => {
    it('should revert functions with a not allowed token as parameter', async () => {
      const stakeAmount = toWei(String(initialTokenSupply / 10));
      const periodId = 0;
      await expectRevert(
        sla.stakeTokens.call(stakeAmount, newToken.address, periodId, {
          from: notOwners[3],
        }),
        'token is not allowed',
      );
      await expectRevert(
        sla.withdraw.call(newToken.address, periodId, {
          from: notOwners[3],
        }),
        'token is not allowed',
      );
      await expectRevert(
        sla.withdrawAndStake.call(
          newToken.address,
          initialTokenSupply,
          periodId,
          {
            from: notOwners[3],
          },
        ),
        'token is not allowed',
      );
    });

    it('should allow the user to stake bDSLA on deployment', async () => {
      const firstTokenAddress = await sla.allowedTokens.call(0);
      assert.equal(
        firstTokenAddress,
        bDSLA.address,
        'bDSLA is not registered as allowed token',
      );
      const bDSLAisAllowed = await sla.allowedTokensMapping.call(bDSLA.address);
      assert.equal(
        bDSLAisAllowed,
        true,
        'bDSLA is not registered as allowed in the mapping',
      );
      const periodId = 0;
      const stakeAmount = toWei(String(initialTokenSupply / 10));
      await bDSLA.approve(sla.address, stakeAmount);
      const allowance = await bDSLA.allowance(owner, sla.address);
      assert.equal(
        allowance.toString(),
        stakeAmount,
        'allowance does not match',
      );
      await sla.stakeTokens(stakeAmount, bDSLA.address, periodId);
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
      let newTokenIsAllowed = await sla.allowedTokensMapping.call(
        newToken.address,
      );
      assert.equal(
        newTokenIsAllowed,
        false,
        'newToken should not be registered as allowed in the mapping',
      );

      await sla.addAllowedTokens(newToken.address);
      newTokenIsAllowed = await sla.allowedTokensMapping.call(newToken.address);
      assert.equal(
        newTokenIsAllowed,
        true,
        'newToken should be registered as allowed in the mapping',
      );

      const stakeAmount = toWei(String(initialTokenSupply / 10));
      const periodId = 0;

      await newToken.approve(sla.address, stakeAmount);
      await sla.stakeTokens(stakeAmount, newToken.address, periodId);
      const userStakesLength = await sla.getTokenStakeLength.call(owner);
      assert.equal(
        userStakesLength,
        1,
        'userStakes has not increased in length',
      );

      const { tokenAddress, stake } = await sla.userStakes.call(owner, 0);
      assert.equal(
        tokenAddress,
        newToken.address,
        'token address does not match with newToken',
      );

      assert.equal(stake, stakeAmount, 'stakes amount does not match');
      const newTokenIndex = await sla.userStakedTokensIndex.call(
        owner,
        newToken.address,
      );

      assert.equal(newTokenIndex, 0, 'newToken index should be 0');
      const userHasNewTokenStaked = await sla.userStakedTokens.call(
        owner,
        newToken.address,
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
      const newTokenStake = await sla.tokensPool.call(newToken.address);
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
