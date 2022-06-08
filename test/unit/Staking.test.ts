import {
  ERC20PresetMinterPauser,
  SLA,
  SLARegistry,
  StakeRegistry,
  Details,
  PeriodRegistry,
  MockMessenger,
} from '../../typechain';
import { ethers, deployments, getNamedAccounts } from 'hardhat';
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
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

enum POSITION {
  OK,
  KO,
}
const baseSLAConfig = {
  sloValue: 50 * 10 ** 3,
  sloType: SLO_TYPE.GreaterThan,
  whitelisted: false,
  periodType: PERIOD_TYPE.WEEKLY,
  initialPeriodId: 0,
  finalPeriodId: 10,
  extraData: [SENetworkNamesBytes32[SENetworks.ONE]],
  leverage: 1,
};

let activeWlSLAConfig = {
  ...baseSLAConfig,
  whitelisted: true,
};

const mintAmount = '1000000';

const setup = deployments.createFixture(async () => {
  const { deployer, notDeployer } = await getNamedAccounts();
  await deployments.fixture(DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE);
  const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
    CONTRACT_NAMES.DSLA
  );

  const slaRegistry: SLARegistry = await ethers.getContract(
    CONTRACT_NAMES.SLARegistry
  );
  const periodRegistry: PeriodRegistry = await ethers.getContract(
    CONTRACT_NAMES.PeriodRegistry
  );
  const details: Details = await ethers.getContract(CONTRACT_NAMES.Details);

  const stakeRegistry: StakeRegistry = await ethers.getContract(
    CONTRACT_NAMES.StakeRegistry
  );
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
  await tx.wait();

  const tx_deploy = await deployments.deploy(CONTRACT_NAMES.MockMessenger, {
    from: deployer,
    log: true,
    args: [
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
      2,
      periodRegistry.address,
      stakeRegistry.address,
      SENetworkNamesBytes32[SENetworks.ONE],
      'UPTIME.ok',
      'UPTIME.ok',
      'UPTIME.ko',
      'UPTIME.ko',
    ]
  })
  const mockMessengerBis: MockMessenger = await ethers.getContractAt(CONTRACT_NAMES.MockMessenger, tx_deploy.address);
  await slaRegistry.registerMessenger(mockMessengerBis.address, 'dummy link');
  let tx_wl = await slaRegistry.createSLA(
    activeWlSLAConfig.sloValue,
    activeWlSLAConfig.sloType,
    activeWlSLAConfig.whitelisted,
    mockMessengerBis.address,
    activeWlSLAConfig.periodType,
    activeWlSLAConfig.initialPeriodId,
    activeWlSLAConfig.finalPeriodId,
    'dummy-ipfs-hash',
    activeWlSLAConfig.extraData,
    activeWlSLAConfig.leverage
  );

  await tx_wl.wait();
  const awlSlaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
  const sla_wl: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, awlSlaAddress);
  await tx_wl.wait();

  return {
    slaRegistry,
    sla,
    sla_wl,
    dslaToken,
    details,
    mockMessenger
  };
});

type Fixture = {
  slaRegistry: SLARegistry;
  sla: SLA;
  sla_wl: SLA;
  dslaToken: ERC20PresetMinterPauser;
  details: Details;
  mockMessenger: MockMessenger;
};

describe(CONTRACT_NAMES.Staking, function () {
  let fixture: Fixture;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  before(async () => {
    [owner, user,] = await ethers.getSigners();
  })
  beforeEach(async function () {
    fixture = await setup();
  });

  describe('constructor', function () {
    it('should revert if messenger is not registered on MessengerRegistry', async () => {
      const { slaRegistry } = fixture;
      await expect(slaRegistry.createSLA(
        baseSLAConfig.sloValue,
        baseSLAConfig.sloType,
        baseSLAConfig.whitelisted,
        ethers.constants.AddressZero,
        baseSLAConfig.periodType,
        baseSLAConfig.initialPeriodId,
        baseSLAConfig.finalPeriodId,
        'dummy-ipfs-hash',
        baseSLAConfig.extraData,
        baseSLAConfig.leverage
      )).to.be.revertedWith('invalid messenger');
    })

    it('should revert if owner address is invalid', async () => {
      const { mockMessenger } = fixture;
      const { deploy } = deployments;
      await expect(deploy(CONTRACT_NAMES.SLA, {
        from: owner.address,
        log: true,
        args: [
          ethers.constants.AddressZero,
          baseSLAConfig.whitelisted,
          baseSLAConfig.periodType,
          mockMessenger.address,
          baseSLAConfig.initialPeriodId,
          baseSLAConfig.finalPeriodId,
          10,
          'dummy-ipfs-hash',
          baseSLAConfig.extraData,
          baseSLAConfig.leverage
        ]
      })).to.be.revertedWith('invalid owner address')
    })
    it('should prevent creation of a stacking contract if incorrect leverage', async () => {
      const { slaRegistry, mockMessenger } = fixture;
      let badLeverageSLAConfig = {
        leverage: 101
      }

      await expect(slaRegistry.createSLA(
        baseSLAConfig.sloValue,
        baseSLAConfig.sloType,
        baseSLAConfig.whitelisted,
        mockMessenger.address,
        baseSLAConfig.periodType,
        baseSLAConfig.initialPeriodId,
        baseSLAConfig.finalPeriodId,
        'dummy-ipfs-hash',
        baseSLAConfig.extraData,
        badLeverageSLAConfig.leverage
      )).to.be.reverted;
    });
  })
  describe('staking', function () {
    it('should perform staking long position for deployer', async () => {
      const { sla, dslaToken, details } = fixture;
      await sla.addAllowedTokens(dslaToken.address);
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
      let detailsarrs = (
        await details.getSLADetailsArrays(sla.address)
      )

      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());
    });

    it('should perform staking short position for deployer when user have long position in pool', async () => {
      const { sla, dslaToken, details } = fixture;
      let amount = 10000;
      let leverage = baseSLAConfig['leverage']

      const numberOfStakingEntity = 2
      const targetStakeAmount = (amount * leverage) * numberOfStakingEntity
      await sla.addAllowedTokens(dslaToken.address);
      await dslaToken.approve(sla.address, amount);

      // user long stake
      await dslaToken.connect(user).approve(sla.address, amount * leverage);
      await sla.connect(user).stakeTokens(
        amount * leverage,
        dslaToken.address,
        POSITION.OK
      );

      await dslaToken.connect(owner).approve(sla.address, amount * leverage);
      await expect(sla.connect(owner).stakeTokens(amount * leverage, dslaToken.address, POSITION.KO))
        .to.emit(sla, 'Stake')
        .withArgs(
          dslaToken.address,
          await sla.nextVerifiablePeriod(),
          owner.address,
          amount * leverage,
          POSITION.KO
        );

      let detailsarrs = (
        await details.getSLADetailsArrays(sla.address)
      )

      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(targetStakeAmount.toString());
    });

    it('should prevent staking short position for deployer if insufficient long position present in staking pool', async () => {
      const { sla, dslaToken, details } = fixture;
      let tx = await sla.addAllowedTokens(dslaToken.address);
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;

      await expect(sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.KO))
        .to.be.revertedWith('Stake exceeds leveraged cap.')
    });

    it('should prevent staking in case of amount exceeds allowance', async () => {
      const { sla, dslaToken, details } = fixture;
      let tx = await sla.addAllowedTokens(dslaToken.address);
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000000;

      await expect(sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.be.revertedWith('ERC20: insufficient allowance')
    });

    it('should prevent staking if token not allowed', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;

      await expect(sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.be.revertedWith('This token is not allowed.')
    });

    it('should prevent staking in case of invalid token address', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;
      const invalidTokenAddress = "0x61A12"
      await expect(sla.stakeTokens(stakeAmount, invalidTokenAddress, POSITION.OK))
        .to.be.reverted;
    });

    it('should prevent staking in case of invalid position side', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;
      const invalidPositionSide = 'longshort'
      await expect(sla.stakeTokens(stakeAmount, dslaToken.address, invalidPositionSide))
        .to.be.reverted;
    });
  })
  describe('add allowed tokens - Creating DTokens', function () {
    it('should add allowed tokens in list if not yet present then perform staking', async () => {
      const { sla, dslaToken } = fixture;
      expect(sla.addAllowedTokens(dslaToken.address))
        .to.emit(sla, 'DTokensCreated');
    });

    it('should revert if token already present in allowedTokens', async () => {
      const { sla, dslaToken } = fixture;
      await sla.addAllowedTokens(dslaToken.address);
      await expect(sla.addAllowedTokens(dslaToken.address)).to.be.revertedWith('This token has been allowed already.');
    });

    it('should revert if token is not allowed in StakeRegistry', async () => {
      const { sla } = fixture;
      await expect(sla.addAllowedTokens(ethers.constants.AddressZero))
        .to.be.revertedWith('This token is not allowed.');
    })
  })
  describe("whitelist", function () {
    it('should perform staking for not whitelisted user if whitelist not activated', async () => {
      const { sla, sla_wl, dslaToken, details } = fixture;
      await sla.addAllowedTokens(dslaToken.address);
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
      let detailsarrs = (
        await details.getSLADetailsArrays(sla.address)
      )

      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());

    });

    // it('should perform staking for contract owner even if whitelist is activated', async () => {
    //   // Contract Owner is added by default in whitelist, it's not needed to add it after contract creation
    //   const { sla_wl, dslaToken, details } = fixture;

    //   await sla_wl.addAllowedTokens(dslaToken.address);
    //   await dslaToken.approve(sla_wl.address, mintAmount);
    //   let stakeAmount = 100000;

    //   await expect(sla_wl.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
    //     .to.emit(sla_wl, 'Stake')
    //     .withArgs(
    //       dslaToken.address,
    //       await sla_wl.nextVerifiablePeriod(),
    //       owner.address,
    //       stakeAmount,
    //       POSITION.OK
    //     );
    //   let detailsarrs = (
    //     await details.getSLADetailsArrays(sla_wl.address)
    //   )

    //   let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
    //   expect(totalStake).equals(stakeAmount.toString());
    // });


    // it('should prevent staking for not whitelisted user if whitelist is activated', async () => {
    //   const { sla_wl, dslaToken } = fixture;
    //   let stakeAmount = 100000;
    //   await dslaToken.approve(sla_wl.address, stakeAmount);

    //   // user long stake
    //   await dslaToken.connect(user).approve(sla_wl.address, stakeAmount);
    //   await sla_wl.addAllowedTokens(dslaToken.address);
    //   await expect(sla_wl.connect(user).stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
    //     .to.be.revertedWith('not whitelisted');
    // });

    // it('should perform staking for whitelisted user if whitelist is activated', async () => {
    //   const { sla_wl, dslaToken, details } = fixture;
    //   let stakeAmount = 100000;
    //   await dslaToken.approve(sla_wl.address, stakeAmount);

    //   // user long stake
    //   await dslaToken.connect(user).approve(sla_wl.address, stakeAmount);
    //   await sla_wl.addAllowedTokens(dslaToken.address);
    //   await sla_wl.addUsersToWhitelist([user.address])

    //   await expect(sla_wl.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
    //     .to.emit(sla_wl, 'Stake')
    //     .withArgs(
    //       dslaToken.address,
    //       await sla_wl.nextVerifiablePeriod(),
    //       owner.address,
    //       stakeAmount,
    //       POSITION.OK
    //     );
    //   let detailsarrs = (
    //     await details.getSLADetailsArrays(sla_wl.address)
    //   )

    //   let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
    //   expect(totalStake).equals(stakeAmount.toString());
    // });

    // it('should perform staking for whitelisted user then deny staking after removal from whitelist if it is activated', async () => {
    //   const { sla_wl, dslaToken, details } = fixture;
    //   let stakeAmount = 100000;
    //   await dslaToken.approve(sla_wl.address, stakeAmount);

    //   // user long stake
    //   await dslaToken.connect(user).approve(sla_wl.address, stakeAmount);
    //   await sla_wl.addAllowedTokens(dslaToken.address);
    //   await sla_wl.addUsersToWhitelist([user.address])

    //   await expect(sla_wl.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
    //     .to.emit(sla_wl, 'Stake')
    //     .withArgs(
    //       dslaToken.address,
    //       await sla_wl.nextVerifiablePeriod(),
    //       owner.address,
    //       stakeAmount,
    //       POSITION.OK
    //     );
    //   let detailsarrs = (
    //     await details.getSLADetailsArrays(sla_wl.address)
    //   )

    //   let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
    //   expect(totalStake).equals(stakeAmount.toString());

    //   await sla_wl.removeUsersFromWhitelist([user.address])
    //   await expect(sla_wl.connect(user).stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
    //     .to.be.revertedWith('not whitelisted');
    // });
  });
});
