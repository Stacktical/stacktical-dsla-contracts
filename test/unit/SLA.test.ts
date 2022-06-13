import { ethers, deployments, getNamedAccounts } from 'hardhat';
import {
  ERC20PresetMinterPauser,
  SLA,
  SLARegistry,
  StakeRegistry,
  Details,
  PeriodRegistry,
  MockMessenger,
  ERC20,
} from '../../typechain';
import {
  CONTRACT_NAMES,
  DEPLOYMENT_TAGS,
  PERIOD_TYPE,
  SENetworkNamesBytes32,
  SENetworks,
  SLO_TYPE,
} from '../../constants';
import { expect } from '../chai-setup';
import { toWei } from 'web3-utils';
import { BigNumber } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { evm_increaseTime, ONE_DAY } from '../helper';
const moment = require('moment');

enum POSITION {
  OK,
  KO,
}
const leverage = 10;
const baseSLAConfig = {
  sloValue: 50 * 10 ** 3,
  sloType: SLO_TYPE.GreaterThan,
  whitelisted: false,
  periodType: PERIOD_TYPE.DAILY,
  initialPeriodId: 0,
  finalPeriodId: 1,
  extraData: [SENetworkNamesBytes32[SENetworks.ONE]],
  leverage: leverage,
};
const mintAmount = '1000000';

const setup = deployments.createFixture(async () => {
  const { deployer, notDeployer } = await getNamedAccounts();
  await deployments.fixture(DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE);
  const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(CONTRACT_NAMES.DSLA);
  const slaRegistry: SLARegistry = await ethers.getContract(CONTRACT_NAMES.SLARegistry);
  const details: Details = await ethers.getContract(CONTRACT_NAMES.Details);
  const stakeRegistry: StakeRegistry = await ethers.getContract(CONTRACT_NAMES.StakeRegistry);
  const periodRegistry: PeriodRegistry = await ethers.getContract(CONTRACT_NAMES.PeriodRegistry);
  await dslaToken.mint(deployer, toWei(mintAmount));
  await dslaToken.mint(notDeployer, toWei(mintAmount));
  await dslaToken.approve(stakeRegistry.address, toWei(mintAmount));

  // deploy mock messenger
  await deployments.deploy(CONTRACT_NAMES.MockMessenger, {
    from: deployer,
    log: true,
    args: [
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      1,
      periodRegistry.address,
      stakeRegistry.address,
      SENetworkNamesBytes32[SENetworks.ONE],
      'UPTIME.ok',
      'UPTIME.ok',
      'UPTIME.ko',
      'UPTIME.ko',
    ]
  })
  const mockMessenger: MockMessenger = await ethers.getContract(CONTRACT_NAMES.MockMessenger);
  await slaRegistry.registerMessenger(mockMessenger.address, 'dummy link');

  let tx = await slaRegistry.createSLA(
    baseSLAConfig.sloValue,
    baseSLAConfig.sloType,
    baseSLAConfig.whitelisted,
    mockMessenger.address,
    baseSLAConfig.periodType,
    baseSLAConfig.initialPeriodId,
    baseSLAConfig.finalPeriodId,
    'dummy-ipfs-hash',
    baseSLAConfig.extraData,
    baseSLAConfig.leverage
  );

  await tx.wait();
  const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
  const sla: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress);
  tx = await sla.addAllowedTokens(dslaToken.address);
  await tx.wait();
  return {
    slaRegistry,
    sla,
    dslaToken,
    details,
    mockMessenger,
    periodRegistry,
    stakeRegistry,
  };
});

type Fixture = {
  slaRegistry: SLARegistry;
  sla: SLA;
  dslaToken: ERC20PresetMinterPauser;
  details: Details;
  mockMessenger: MockMessenger;
  periodRegistry: PeriodRegistry;
  stakeRegistry: StakeRegistry;
};

describe(CONTRACT_NAMES.SLA, function () {
  let fixture: Fixture;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  let user1: SignerWithAddress;
  before(async function () {
    [owner, user, user1] = await ethers.getSigners();
  })
  beforeEach(async function () {
    fixture = await setup();
  });
  describe('register SLI', function () {
    it('should allow SLI registration only for messenger of the SLA', async () => {
      const { sla } = fixture;
      await expect(sla.connect(owner).registerSLI(0, 0))
        .to.be.revertedWith('not messenger');
    })
    it('should revert sli registration if period is not the next verifiable period', async () => {
      const { sla, mockMessenger, slaRegistry, periodRegistry } = fixture;
      const periodStart = moment()
        .utc(0)
        .startOf('month')
        .add(10, 'month')
        .startOf('month')
        .unix();
      await periodRegistry.addPeriodsToPeriodType(
        PERIOD_TYPE.DAILY,
        [periodStart],
        [periodStart + 1000]
      );
      await evm_increaseTime(periodStart + 1000)

      // make contract finished
      await slaRegistry.requestSLI(0, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(0, 100))
        .to.be.emit(sla, 'SLICreated')
        .to.be.emit(sla, 'UserCompensationGenerated');

      await slaRegistry.requestSLI(1, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(0, 100)).to.be.revertedWith('invalid period id')
      await expect(mockMessenger.mockFulfillSLI(1, 100000))
        .to.be.emit(sla, 'SLICreated')
        .to.be.emit(sla, 'ProviderRewardGenerated');

      await expect(slaRegistry.requestSLI(2, sla.address, true))
        .to.be.revertedWith('invalid period');

    })
    it('should allow requesting sli from sla registry', async () => {
      const { sla, mockMessenger, slaRegistry, periodRegistry } = fixture;
      const periodStart = moment()
        .utc(0)
        .startOf('month')
        .add(10, 'month')
        .startOf('month')
        .unix();
      await periodRegistry.addPeriodsToPeriodType(
        PERIOD_TYPE.DAILY,
        [periodStart],
        [periodStart + 1000]
      );
      await evm_increaseTime(periodStart + 1000)

      // make contract finished
      await slaRegistry.requestSLI(0, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(0, 100))
        .to.be.emit(sla, 'SLICreated')
        .to.be.emit(sla, 'UserCompensationGenerated');

      await slaRegistry.requestSLI(1, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(1, 100000))
        .to.be.emit(sla, 'SLICreated')
        .to.be.emit(sla, 'ProviderRewardGenerated');
    })
  })
  describe('stake tokens', function () {
    it('should not allow staking 0 amount', async () => {
      const { sla, dslaToken } = fixture;
      await expect(
        sla.stakeTokens(0, dslaToken.address, POSITION.OK)
      ).to.be.revertedWith('Stake must be greater than 0.');
    });
    it('should now allow staking when contract is finished', async () => {
      const { sla, dslaToken, mockMessenger, slaRegistry, periodRegistry } = fixture;
      const periodStart = moment()
        .utc(0)
        .startOf('month')
        .add(10, 'month')
        .startOf('month')
        .unix();
      await periodRegistry.addPeriodsToPeriodType(
        PERIOD_TYPE.DAILY,
        [periodStart],
        [periodStart + 1000]
      );
      await evm_increaseTime(periodStart + 1000)

      // make contract finished
      await slaRegistry.requestSLI(0, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(0, 100))
        .to.be.emit(sla, 'SLICreated');

      await slaRegistry.requestSLI(1, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(1, 100000))
        .to.be.emit(sla, 'SLICreated');

      await evm_increaseTime(periodStart + 1000 + ONE_DAY);
      expect(await sla.contractFinished()).to.be.true;

      await expect(
        sla.stakeTokens(0, dslaToken.address, POSITION.OK)
      ).to.be.revertedWith('This SLA has terminated.');
    })
    it('should receive dp/du tokens when you stake tokens', async () => {
      // TODO:
    })
  })
  describe('withdraw', function () {
    it('should not let user withdraw tokens if the contract is not finished', async function () {
      const { sla, dslaToken, details } = fixture;
      let amount = 10000;

      // user long stake
      await dslaToken.connect(user).approve(sla.address, ethers.constants.MaxUint256);
      await sla.connect(user).stakeTokens(
        amount * leverage,
        dslaToken.address,
        POSITION.OK
      );
      await sla.connect(user).stakeTokens(
        amount,
        dslaToken.address,
        POSITION.OK
      );

      await dslaToken.approve(sla.address, amount);
      await sla.stakeTokens(
        amount,
        dslaToken.address,
        POSITION.KO
      );
      const duTokenAddress = await sla.duTokenRegistry(dslaToken.address);
      const duToken: ERC20PresetMinterPauser = await ethers.getContractAt(
        'ERC20PresetMinterPauser',
        duTokenAddress,
        user
      );
      await duToken.approve(sla.address, amount);

      await expect(
        sla.connect(user).withdrawUserTokens(amount, dslaToken.address)
      ).to.be.revertedWith('User lock-up until the next verification.');
      let totalStake = (
        await details.getSLADetailsArrays(sla.address)
      ).tokensStake[0].totalStake.toString();
      expect(totalStake).equals((amount * 12).toString());
    });

    it('should distribute rewards to sla and protocol owner when claiming user tokens', async () => {
      const { sla, dslaToken, periodRegistry, slaRegistry, mockMessenger, stakeRegistry } = fixture;
      let amount = 10000;

      // user long stake
      await dslaToken.connect(user).approve(sla.address, amount * leverage);
      await sla.connect(user).stakeTokens(
        amount * leverage,
        dslaToken.address,
        POSITION.OK
      );

      await dslaToken.connect(owner).approve(sla.address, amount);
      await sla.connect(owner).stakeTokens(
        amount,
        dslaToken.address,
        POSITION.KO
      );

      // make contract finished
      const periodStart = moment()
        .utc(0)
        .startOf('month')
        .add(10, 'month')
        .startOf('month')
        .unix();
      await periodRegistry.addPeriodsToPeriodType(
        PERIOD_TYPE.DAILY,
        [periodStart],
        [periodStart + 1000]
      );
      await evm_increaseTime(periodStart + 1000)

      await slaRegistry.requestSLI(0, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(0, 100))
        .to.be.emit(sla, 'SLICreated');

      await slaRegistry.requestSLI(1, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(1, 100))
        .to.be.emit(sla, 'SLICreated');

      await evm_increaseTime(periodStart + 1000 + ONE_DAY);
      expect(await sla.contractFinished()).to.be.true;

      // approve duToken
      const duTokenAddress = await sla.duTokenRegistry(dslaToken.address);
      const duToken: ERC20 = await ethers.getContractAt(CONTRACT_NAMES.ERC20, duTokenAddress);
      await duToken.approve(sla.address, ethers.constants.MaxUint256);

      // withdraw user tokens
      const beforeDslaBalance = await dslaToken.balanceOf(owner.address);
      await stakeRegistry.connect(owner).transferOwnership(user1.address);
      await sla.connect(owner).transferOwnership(user.address);
      await expect(sla.connect(owner).withdrawUserTokens(amount, dslaToken.address))
        .to.emit(sla, 'UserWithdraw');

      // 0.3 % should be distributed to sla owner
      expect(await dslaToken.balanceOf(user.address))
        .to.be.equal(BigNumber.from(amount).mul(30).div(10000).add(toWei(mintAmount)).sub(amount * 10))
      // 0.15% should be distributed to protocol (stakeRegistry)
      expect(await dslaToken.balanceOf(user1.address))
        .to.be.equal(BigNumber.from(amount).mul(15).div(10000))
      // you should receive 99.55% tokens
      const afterDslaBalance = await dslaToken.balanceOf(owner.address);
      expect(afterDslaBalance.sub(beforeDslaBalance))
        .to.be.equal(BigNumber.from(amount).mul(9955).div(10000))

      await stakeRegistry.connect(user1).transferOwnership(owner.address);
    })

    it('should not let the deployer withdraw provider tokens if the contract is not finished', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, ethers.constants.MaxUint256);
      await sla.stakeTokens(mintAmount, dslaToken.address, POSITION.OK);
      await sla.stakeTokens(mintAmount, dslaToken.address, POSITION.OK);
      const duTokenAddress = await sla.dpTokenRegistry(dslaToken.address);
      const duToken: ERC20PresetMinterPauser = await ethers.getContractAt(
        'ERC20PresetMinterPauser',
        duTokenAddress,
        owner
      );
      await duToken.approve(sla.address, mintAmount);

      await expect(
        sla.withdrawProviderTokens(mintAmount, dslaToken.address)
      ).to.be.revertedWith('Provider lock-up until the next verification.');

      let totalStake = (
        await details.getSLADetailsArrays(sla.address)
      ).tokensStake[0].totalStake.toString();
      expect(totalStake).equals((parseInt(mintAmount) * 2).toString());
    });

    it('should distribute rewards to sla owner and protocol owner when claiming provider tokens', async () => {
      const { sla, dslaToken, mockMessenger, slaRegistry, periodRegistry, stakeRegistry } = fixture;
      let stakeAmount = 100000;
      await dslaToken.approve(sla.address, ethers.constants.MaxUint256);
      await sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK);

      // can't withdraw if the contract is not finished
      await expect(
        sla.withdrawProviderTokens(mintAmount, dslaToken.address)
      ).to.be.revertedWith('Provider lock-up until the next verification.');

      // make contract finished
      const periodStart = moment()
        .utc(0)
        .startOf('month')
        .add(10, 'month')
        .startOf('month')
        .unix();
      await periodRegistry.addPeriodsToPeriodType(
        PERIOD_TYPE.DAILY,
        [periodStart],
        [periodStart + 1000]
      );
      await evm_increaseTime(periodStart + 1000)

      await slaRegistry.requestSLI(0, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(0, 100))
        .to.be.emit(sla, 'SLICreated');

      await slaRegistry.requestSLI(1, sla.address, true);
      await expect(mockMessenger.mockFulfillSLI(1, 100))
        .to.be.emit(sla, 'SLICreated');

      await evm_increaseTime(periodStart + 1000 + ONE_DAY);
      expect(await sla.contractFinished()).to.be.true;

      // approve dp token
      const beforeDslaBalance = await dslaToken.balanceOf(owner.address);
      const dpTokenAddr = await sla.dpTokenRegistry(dslaToken.address);
      const dpToken = await ethers.getContractAt(CONTRACT_NAMES.ERC20, dpTokenAddr);
      await dpToken.connect(owner).approve(sla.address, ethers.constants.MaxUint256);
      await stakeRegistry.connect(owner).transferOwnership(user1.address);
      await sla.connect(owner).transferOwnership(user.address);
      await expect(sla.withdrawProviderTokens(stakeAmount, dslaToken.address))
        .to.emit(sla, 'ProviderWithdraw');

      // 0.3 % should be distributed to sla owner
      expect(await dslaToken.balanceOf(user.address))
        .to.be.equal(BigNumber.from(stakeAmount).mul(30).div(10000).add(toWei(mintAmount)))
      // 0.15% should be distributed to protocol (stakeRegistry)
      expect(await dslaToken.balanceOf(user1.address))
        .to.be.equal(BigNumber.from(stakeAmount).mul(15).div(10000))
      // you should receive 99.55% tokens
      const afterDslaBalance = await dslaToken.balanceOf(owner.address);
      expect(afterDslaBalance.sub(beforeDslaBalance))
        .to.be.equal(BigNumber.from(stakeAmount).mul(9955).div(10000))

      await stakeRegistry.connect(user1).transferOwnership(owner.address);
    });
  })

  describe('stake', function () {
    it('should check that a normal amount of token can be staked', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;
      await expect(sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.emit(sla, 'Stake')
        .withArgs(
          dslaToken.address,
          await sla.nextVerifiablePeriod(),
          owner.address,
          stakeAmount,
          POSITION.OK
        );
      let totalStake = (
        await details.getSLADetailsArrays(sla.address)
      ).tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());
    });

    it('should check that a negative amount of token cant be staked', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, mintAmount);

      await expect(sla.stakeTokens(0, dslaToken.address, POSITION.OK)).to.be
        .revertedWith('Stake must be greater than 0.');
      let totalStake = (
        await details.getSLADetailsArrays(sla.address)
      ).tokensStake[0].totalStake.toString();
      expect(totalStake).equals('0');
    });

    it('should revert if number is overflowing', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, mintAmount);
      const bigNumber = BigNumber.from(10).pow(32);
      await expect(sla.stakeTokens(bigNumber, dslaToken.address, POSITION.OK))
        .to.be.reverted;

      let totalStake = (
        await details.getSLADetailsArrays(sla.address)
      ).tokensStake[0].totalStake.toString();
      expect(totalStake).equals('0');
    });

    it('checks that allowed period is returning true if period is allowed', async () => {
      const { sla } = fixture;
      let isAllowedPeriod = await sla.isAllowedPeriod(0);
      expect(isAllowedPeriod).to.be.true;
    });

    it('checks that allowed period is returning false if period is not allowed', async () => {
      const { sla } = fixture;
      let isAllowedPeriod = await sla.isAllowedPeriod(11);
      expect(isAllowedPeriod).to.be.false;
    });

    it('checks that the contract is not finished', async () => {
      const { sla } = fixture;
      let isContractFinished = await sla.contractFinished();
      expect(isContractFinished).to.be.false;
    });

    it('checks that the stakers length is 0 if there are no stakers', async () => {
      const { sla } = fixture;
      let stakersLength = await sla.getStakersLength();
      expect(stakersLength).to.be.equal(0);
    });

    it('checks that the stakers length is 1 if there are is 1 staker', async () => {
      const { sla, dslaToken } = fixture;
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;
      await sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK);

      let stakersLength = await sla.getStakersLength();
      expect(stakersLength).to.be.equal(1);
    });

    it('checks that the stakers length is 2 if there are are 2 stakers for short and long positions', async () => {
      const { sla, dslaToken } = fixture;
      let amount = 10000;
      await dslaToken.approve(sla.address, amount);

      // user long stake
      await dslaToken.connect(user).approve(sla.address, amount * leverage);
      await sla.connect(user).stakeTokens(
        amount * leverage,
        dslaToken.address,
        POSITION.OK
      );

      // provider long stake
      await dslaToken.connect(owner).approve(sla.address, amount);
      await sla.connect(owner).stakeTokens(amount, dslaToken.address, POSITION.KO);

      // check stakers length
      let stakersLength = await sla.getStakersLength();
      expect(stakersLength).to.be.equal(2);
    });

    it('should revert because the short position is larger than the long position', async () => {
      const { sla, dslaToken } = fixture;
      let amount = 10000;
      await dslaToken.approve(sla.address, amount);

      // user long stake
      await dslaToken.connect(user).approve(sla.address, amount);
      await sla.connect(user).stakeTokens(amount, dslaToken.address, POSITION.OK);

      // provider long stake
      await dslaToken.connect(owner).approve(sla.address, amount);
      await expect(
        sla.connect(owner).stakeTokens(amount, dslaToken.address, POSITION.KO)
      ).to.be.reverted;
    });
  })
});
