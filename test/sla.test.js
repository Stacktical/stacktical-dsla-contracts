import { expectRevert } from '@openzeppelin/test-helpers';
import { expect } from 'chai';
import { fromWei } from 'web3-utils';
import { networkNames, networkNamesBytes32, networks } from '../constants';
import {
  getChainlinkJobId, generatePeriods, getIPFSHash, eventListener,
} from './helpers';

const SLA = artifacts.require('SLA');
const IERC20 = artifacts.require('IERC20');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
const SEMessenger = artifacts.require('SEMessenger');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');
const { envParameters, needsGetJobId } = require('../environments');

const { toWei } = web3.utils;

const initialTokenSupply = '1000000';
const stakeAmount = initialTokenSupply / 100;
const stakeAmountWei = toWei(String(stakeAmount));
const sloValue = 50000;
const sloType = 4;
const slaNetwork = networkNames[0];
const slaNetworkBytes32 = networkNamesBytes32[0];
const yearlyPeriods = 52;
const [periodStarts, periodEnds] = generatePeriods(52);

const periodType = 2;

describe('SLA', () => {
  // Addresses
  let owner;
  let notOwner;
  // Tokens
  let bdsla;
  let dai;
  let usdc;
  let chainlinkToken;
  // Registry
  let stakeRegistry;
  let messengerRegistry;
  let slaRegistry;
  let periodRegistry;
  // Others
  let seMessenger;
  let networkAnalytics;
  let slo;
  let sla;
  let ipfsHash;

  before(async () => {
    [owner, notOwner] = await web3.eth.getAccounts();
    bdsla = await bDSLA.new();
    await bdsla.mint(owner, toWei(initialTokenSupply));
    usdc = await USDC.new(); // to simulate a new token
    await usdc.mint(owner, toWei(initialTokenSupply));
    dai = await DAI.new();
    await dai.mint(owner, toWei(initialTokenSupply));
    chainlinkToken = await IERC20.at(envParameters.chainlinkTokenAddress);

    periodRegistry = await PeriodRegistry.new();
    messengerRegistry = await MessengerRegistry.new();
    stakeRegistry = await StakeRegistry.new(
      bdsla.address,
    );

    const chainlinkJobId = !needsGetJobId
      ? envParameters.chainlinkJobId : await getChainlinkJobId();

    // mint to owner
    await bdsla.mint(owner, toWei(initialTokenSupply));
    await usdc.mint(owner, toWei(initialTokenSupply));
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
    const sloRegistry = await SLORegistry.new();

    // create a SLO with really low value to get respected period
    await sloRegistry.createSLO(sloValue, sloType);
    slo = await sloRegistry.sloAddresses.call(sloValue, sloType);

    await stakeRegistry.addAllowedTokens(dai.address);
    await stakeRegistry.addAllowedTokens(usdc.address);

    networkAnalytics = await NetworkAnalytics.new(
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      chainlinkJobId,
      periodRegistry.address,
    );

    seMessenger = await SEMessenger.new(
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      chainlinkJobId,
      networkAnalytics.address,
    );

    slaRegistry = await SLARegistry.new(
      sloRegistry.address,
      periodRegistry.address,
      messengerRegistry.address,
      stakeRegistry.address,
    );

    await slaRegistry.setMessengerSLARegistryAddress(
      seMessenger.address,
    );

    await periodRegistry.initializePeriod(
      periodType,
      periodStarts,
      periodEnds,
      yearlyPeriods,
    );

    await networkAnalytics.addNetwork(slaNetworkBytes32);

    await chainlinkToken.transfer(
      networkAnalytics.address,
      web3.utils.toWei('0.2'),
    );
    // periods 0 is already finished
    await networkAnalytics.requestAnalytics(0, periodType, slaNetworkBytes32);
    await eventListener(networkAnalytics, 'AnalyticsReceived');

    await chainlinkToken.transfer(
      seMessenger.address,
      web3.utils.toWei('10'),
    );
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
      await expectRevert(
        sla.stakeTokens.call(stakeAmountWei, usdc.address, {
          from: notOwner,
        }),
        'token is not allowed',
      );
    });

    it('should allow the user to stake DSLA on deployment', async () => {
      const firstTokenAddress = await sla.allowedTokens.call(0);
      assert.equal(
        firstTokenAddress,
        bdsla.address,
        'bDSLA is not registered as allowed token',
      );
      const bDSLAisAllowed = await sla.isAllowedToken.call(bdsla.address);
      assert.equal(
        bDSLAisAllowed,
        true,
        'bDSLA is not registered as allowed in the mapping',
      );
      await bdsla.approve(sla.address, stakeAmountWei);
      const allowance = await bdsla.allowance(owner, sla.address);
      assert.equal(
        allowance.toString(),
        stakeAmountWei,
        'allowance does not match',
      );
      await sla.stakeTokens(stakeAmountWei, bdsla.address);
    });

    it('should let the owner to add tokens to the SLA', async () => {
      let usdcIsAllowed = await sla.isAllowedToken.call(
        usdc.address,
      );
      assert.equal(
        usdcIsAllowed,
        false,
        'usdc should not be registered as allowed in the mapping',
      );

      await sla.addAllowedTokens(usdc.address);
      usdcIsAllowed = await sla.isAllowedToken.call(usdc.address);
      assert.equal(
        usdcIsAllowed,
        true,
        'usdc should be registered as allowed in the mapping',
      );

      await usdc.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, usdc.address);
    });
    it('should not allow the user to stake more than provider stake', async () => {
      // Owner
      // 1 * bsdla
      await bdsla.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, bdsla.address);
      // NotOwner
      // 2 * bsdla
      await bdsla.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, bdsla.address, { from: notOwner });
      await bdsla.approve(sla.address, stakeAmountWei, { from: notOwner });
      await expectRevert(sla.stakeTokens(stakeAmountWei, bdsla.address, { from: notOwner }), 'Cannot stake more than SLA provider stake');
    });

    it('should record stakes properly', async () => {
      // allow dai and usdc
      await sla.addAllowedTokens(dai.address);
      await sla.addAllowedTokens(usdc.address);

      // Owner
      // 3 * bsdla + 3 * dai + 3 usdc
      await bdsla.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, bdsla.address);
      await bdsla.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, bdsla.address);
      await bdsla.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, bdsla.address);
      await dai.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, dai.address);
      await dai.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, dai.address);
      await dai.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, dai.address);
      await usdc.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, usdc.address);
      await usdc.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, usdc.address);
      await usdc.approve(sla.address, stakeAmountWei);
      await sla.stakeTokens(stakeAmountWei, usdc.address);

      // NotOwner
      // 2 * dai + 3 * usdc
      await dai.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, dai.address, { from: notOwner });
      await dai.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, dai.address, { from: notOwner });
      await usdc.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, usdc.address, { from: notOwner });
      await usdc.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, usdc.address, { from: notOwner });
      await usdc.approve(sla.address, stakeAmountWei, { from: notOwner });
      await sla.stakeTokens(stakeAmountWei, usdc.address, { from: notOwner });

      // Stakeholders positions
      const bdslaOwnerPosition = await sla.stakeHoldersPositions.call(bdsla.address, owner);
      const daiOwnerPosition = await sla.stakeHoldersPositions.call(dai.address, owner);
      const usdcOwnerPosition = await sla.stakeHoldersPositions.call(usdc.address, owner);
      const bdslaNotOwnerPosition = await sla.stakeHoldersPositions.call(bdsla.address, notOwner);
      const daiNotOwnerPosition = await sla.stakeHoldersPositions.call(dai.address, notOwner);
      const usdcNotOwnerPosition = await sla.stakeHoldersPositions.call(usdc.address, notOwner);
      expect(bdslaOwnerPosition.toString()).to.eq(String(3 * stakeAmountWei));
      expect(daiOwnerPosition.toString()).to.eq(String(3 * stakeAmountWei));
      expect(usdcOwnerPosition.toString()).to.eq(String(3 * stakeAmountWei));
      expect(bdslaNotOwnerPosition.toString()).to.eq(String(0 * stakeAmountWei));
      expect(daiNotOwnerPosition.toString()).to.eq(String(2 * stakeAmountWei));
      expect(usdcNotOwnerPosition.toString()).to.eq(String(3 * stakeAmountWei));

      // Token pools
      const bdslaPool = await sla.tokenPools.call(bdsla.address);
      const daiPool = await sla.tokenPools.call(dai.address);
      const usdcPool = await sla.tokenPools.call(usdc.address);

      expect(bdslaPool.toString()).to.eq(String(3 * stakeAmountWei));
      expect(daiPool.toString()).to.eq(String(5 * stakeAmountWei));
      expect(usdcPool.toString()).to.eq(String(6 * stakeAmountWei));

      // Users stake record: it only tracks the users (notOwner) stake to calculate compensations
      // in this case, is equal to notOwner stakes
      const bdslaStakeRecord = await sla.usersStakeRecord.call(bdsla.address);
      const daiStakeRecord = await sla.usersStakeRecord.call(dai.address);
      const usdcStakeRecord = await sla.usersStakeRecord.call(usdc.address);

      expect(bdslaStakeRecord.toString()).to.eq(String(0 * stakeAmountWei));
      expect(daiStakeRecord.toString()).to.eq(String(2 * stakeAmountWei));
      expect(usdcStakeRecord.toString()).to.eq(String(3 * stakeAmountWei));
    });

    it('should calculate provider reward properly', async () => {
      // allow dai and usdc
      await sla.addAllowedTokens(dai.address);
      await sla.addAllowedTokens(usdc.address);

      // Owner
      // 3 * bsdla + 3 * dai + 3 usdc
      const providerDSLAStake = toWei(String(3 * stakeAmount));
      await bdsla.approve(sla.address, providerDSLAStake);
      await sla.stakeTokens(providerDSLAStake, bdsla.address);
      const providerDAIStake = toWei(String(3 * stakeAmount));
      await dai.approve(sla.address, providerDAIStake);
      await sla.stakeTokens(providerDAIStake, dai.address);
      const providerUSDCStake = toWei(String(3 * stakeAmount));
      await usdc.approve(sla.address, providerUSDCStake);
      await sla.stakeTokens(providerUSDCStake, usdc.address);

      // NotOwner
      // 2 * dai + 3 * usdc
      const userDSLAStake = toWei(String(0 * stakeAmount));
      const userDAIStake = toWei(String(2 * stakeAmount));
      await dai.approve(sla.address, userDAIStake, { from: notOwner });
      await sla.stakeTokens(userDAIStake, dai.address, { from: notOwner });
      const userUSDCStake = toWei(String(3 * stakeAmount));
      await usdc.approve(sla.address, userUSDCStake, { from: notOwner });
      await sla.stakeTokens(userUSDCStake, usdc.address, { from: notOwner });

      // calculate reward for period 0
      let periodId = 0;
      await slaRegistry.requestSLI(periodId, sla.address);
      const slaCreationBlock = await sla.creationBlockNumber.call();
      const { values: { _sli } } = await eventListener(sla, 'SLICreated');
      const precision = 10000;
      let deviation = ((Number(_sli) - sloValue) * precision) / ((Number(_sli) + sloValue) / 2);
      // normalizedPeriod = 1, periodsLength = 10
      let expectedRewardPercentage = String(Math.floor((deviation * 1) / 10));
      let rewardsGenerated = await sla.getPastEvents('ProviderRewardGenerated', {
        filter: {
          periodId,
        },
        fromBlock: slaCreationBlock,
      });
      // bDSLA reward
      const { returnValues: bdslaReward } = rewardsGenerated.find(
        (reward) => reward.returnValues.tokenAddress === bdsla.address,
      );
      expect(bdslaReward.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
      let expectedDSLAReward = toWei(
        String((Number(fromWei(userDSLAStake)) * Number(expectedRewardPercentage))
        / (precision * 100)),
      );
      expect(bdslaReward.amount.toString()).to.equal(expectedDSLAReward);

      // DAI reward
      const { returnValues: daiReward } = rewardsGenerated.find(
        (reward) => reward.returnValues.tokenAddress === dai.address,
      );
      expect(daiReward.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
      let expectedDAIReward = toWei(
        String((Number(fromWei(userDAIStake)) * Number(expectedRewardPercentage))
        / (precision * 100)),
      );
      expect(daiReward.amount.toString()).to.equal(expectedDAIReward);

      // // USDC reward
      const { returnValues: usdcReward } = rewardsGenerated.find(
        (reward) => reward.returnValues.tokenAddress === usdc.address,
      );
      expect(usdcReward.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
      let expectedUSDCReward = toWei(
        String((Number(fromWei(userUSDCStake)) * Number(expectedRewardPercentage))
        / (precision * 100)),
      );
      expect(usdcReward.amount.toString()).to.equal(expectedUSDCReward);

      // periods 1 is already finished
      // Request period 1 sli
      periodId = 1;
      await networkAnalytics.requestAnalytics(1, periodType, slaNetworkBytes32);
      await eventListener(networkAnalytics, 'AnalyticsReceived');
      await slaRegistry.requestSLI(periodId, sla.address);
      const { values: { _sli: _sli1 } } = await eventListener(sla, 'SLICreated');
      deviation = ((Number(_sli1) - sloValue) * precision) / ((Number(_sli1) + sloValue) / 2);
      // normalizedPeriod = 2, periodsLength = 10
      expectedRewardPercentage = String(Math.floor((deviation * 2) / 10));
      rewardsGenerated = await sla.getPastEvents('ProviderRewardGenerated', {
        filter: {
          periodId,
        },
        fromBlock: slaCreationBlock,
      });
      // bDSLA reward
      const { returnValues: bdslaReward1 } = rewardsGenerated.find(
        (reward) => reward.returnValues.tokenAddress === bdsla.address,
      );
      expect(bdslaReward1.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
      expectedDSLAReward = toWei(
        String(
          (Number(
            fromWei(userDSLAStake) - fromWei(expectedDSLAReward),
          ) * Number(expectedRewardPercentage))
        / (precision * 100),
        ),
      );
      expect(bdslaReward1.amount.toString()).to.equal(expectedDSLAReward);

      // DAI reward
      const { returnValues: daiReward1 } = rewardsGenerated.find(
        (reward) => reward.returnValues.tokenAddress === dai.address,
      );
      expect(daiReward1.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
      expectedDAIReward = toWei(
        String(
          (Number(
            fromWei(userDAIStake) - fromWei(expectedDAIReward),
          ) * Number(expectedRewardPercentage))
        / (precision * 100),
        ),
      );
      expect(daiReward1.amount.toString()).to.equal(expectedDAIReward);

      // // USDC reward
      const { returnValues: usdcReward1 } = rewardsGenerated.find(
        (reward) => reward.returnValues.tokenAddress === usdc.address,
      );
      expect(usdcReward1.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
      expectedUSDCReward = toWei(
        String(
          (Number(
            fromWei(userUSDCStake) - fromWei(expectedUSDCReward),
          ) * Number(expectedRewardPercentage))
        / (precision * 100),
        ),
      );
      expect(usdcReward1.amount.toString()).to.equal(expectedUSDCReward);
    });
  });

  it.only('should deplete the pools after last period finishes', async () => {
    // register only the first period, which is finished but not verified
    await slaRegistry.createSLA(
      slo,
      ipfsHash,
      periodType,
      [0],
      seMessenger.address,
      false,
      [slaNetworkBytes32],
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
    await sla.addAllowedTokens(dai.address);
    await sla.addAllowedTokens(usdc.address);

    // Owner
    // 3 * bsdla + 3 * dai + 3 usdc
    const providerDSLAStake = toWei(String(3 * stakeAmount));
    await bdsla.approve(sla.address, providerDSLAStake);
    await sla.stakeTokens(providerDSLAStake, bdsla.address);
    const providerDAIStake = toWei(String(3 * stakeAmount));
    await dai.approve(sla.address, providerDAIStake);
    await sla.stakeTokens(providerDAIStake, dai.address);
    const providerUSDCStake = toWei(String(3 * stakeAmount));
    await usdc.approve(sla.address, providerUSDCStake);
    await sla.stakeTokens(providerUSDCStake, usdc.address);

    // NotOwner
    // 2 * dai + 3 * usdc
    const userDSLAStake = toWei(String(0 * stakeAmount));
    const userDAIStake = toWei(String(2 * stakeAmount));
    await dai.approve(sla.address, userDAIStake, { from: notOwner });
    await sla.stakeTokens(userDAIStake, dai.address, { from: notOwner });
    const userUSDCStake = toWei(String(3 * stakeAmount));
    await usdc.approve(sla.address, userUSDCStake, { from: notOwner });
    await sla.stakeTokens(userUSDCStake, usdc.address, { from: notOwner });

    // calculate reward for period 0, the only period
    const periodId = 0;
    const slaCreationBlock = await sla.creationBlockNumber.call();
    await slaRegistry.requestSLI(periodId, sla.address);
    await eventListener(sla, 'SLICreated');
    const precision = 10000;
    // uint256 rewardPercentage = _periodId != periodIds[periodIds.length - 1]
    //  ? deviation.mul(normalizedPeriodId).div(periodIds.length)
    //  : uint256(100).mul(precision);
    // normalizedPeriod = 1, periodsLength = 10
    const expectedRewardPercentage = String(100 * precision);
    const rewardsGenerated = await sla.getPastEvents('ProviderRewardGenerated', {
      filter: {
        periodId,
      },
      fromBlock: slaCreationBlock,
    });
      // bDSLA reward
    const { returnValues: bdslaReward } = rewardsGenerated.find(
      (reward) => reward.returnValues.tokenAddress === bdsla.address,
    );
    expect(bdslaReward.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
    const expectedDSLAReward = toWei(
      String((Number(fromWei(userDSLAStake)) * Number(expectedRewardPercentage))
        / (precision * 100)),
    );
    expect(bdslaReward.amount.toString()).to.equal(expectedDSLAReward);
    expect(bdslaReward.amount.toString()).to.equal(userDSLAStake);

    // DAI reward
    const { returnValues: daiReward } = rewardsGenerated.find(
      (reward) => reward.returnValues.tokenAddress === dai.address,
    );
    expect(daiReward.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
    const expectedDAIReward = toWei(
      String((Number(fromWei(userDAIStake)) * Number(expectedRewardPercentage))
        / (precision * 100)),
    );
    expect(daiReward.amount.toString()).to.equal(expectedDAIReward);
    expect(daiReward.amount.toString()).to.equal(userDAIStake);

    // // USDC reward
    const { returnValues: usdcReward } = rewardsGenerated.find(
      (reward) => reward.returnValues.tokenAddress === usdc.address,
    );
    expect(usdcReward.rewardPercentage.toString()).to.equal(expectedRewardPercentage);
    const expectedUSDCReward = toWei(
      String((Number(fromWei(userUSDCStake)) * Number(expectedRewardPercentage))
        / (precision * 100)),
    );
    expect(usdcReward.amount.toString()).to.equal(expectedUSDCReward);
    expect(usdcReward.amount.toString()).to.equal(userUSDCStake);

    // User position should be 0 for everything
    const notOwnerDSLAPosition = await sla.stakeHoldersPositions(bdsla.address, notOwner);
    const notOwnerDAIPosition = await sla.stakeHoldersPositions(dai.address, notOwner);
    const notOwnerUSDCPosition = await sla.stakeHoldersPositions(usdc.address, notOwner);
    expect(notOwnerDSLAPosition.toString()).to.equal('0');
    expect(notOwnerDAIPosition.toString()).to.equal('0');
    expect(notOwnerUSDCPosition.toString()).to.equal('0');

    // Provider position should be the summation of user and provider pool
    const ownerDSLAPosition = await sla.stakeHoldersPositions(bdsla.address, owner);
    const ownerDAIPosition = await sla.stakeHoldersPositions(dai.address, owner);
    const ownerUSDCPosition = await sla.stakeHoldersPositions(usdc.address, owner);
    expect(ownerDSLAPosition).to.equal(
      toWei(String(fromWei(providerDSLAStake) + fromWei(userDSLAStake))),
    );
    expect(ownerDAIPosition).to.equal(
      toWei(String(fromWei(providerDAIStake) + fromWei(userDAIStake))),
    );
    expect(ownerUSDCPosition).to.equal(
      toWei(String(fromWei(providerUSDCStake) + fromWei(userUSDCStake))),
    );
  });
});
