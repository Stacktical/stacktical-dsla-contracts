const hre = require('hardhat');
import {
  ERC20PresetMinterPauser,
  ERC20PresetMinterPauser__factory,
  SLA,
  SLA__factory,
  SLARegistry,
  StakeRegistry,
  Details,
  IMessenger
} from '../../typechain';
const { ethers, waffle, deployments, getNamedAccounts } = hre;
import {
  CONTRACT_NAMES,
  DEPLOYMENT_TAGS,
  PERIOD_TYPE,
  SENetworkNames,
  SENetworkNamesBytes32,
  SENetworks,
  SLO_TYPE,
} from '../../constants';
const { deployMockContract } = waffle;
import { expect } from '../chai-setup';
import { fromWei, toWei } from 'web3-utils';

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
  sloValue: 50 * 10 ** 3,
  sloType: SLO_TYPE.GreaterThan,
  whitelisted: true,
  periodType: PERIOD_TYPE.WEEKLY,
  initialPeriodId: 0,
  finalPeriodId: 10,
  extraData: [SENetworkNamesBytes32[SENetworks.ONE]],
  leverage: 1,
};

const mintAmount = '1000000';

const setup = deployments.createFixture(async () => {
  const { deployments } = hre;
  const { deployer, notDeployer } = await getNamedAccounts();
  await deployments.fixture(DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE);
  const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
    CONTRACT_NAMES.DSLA
  );

  const slaRegistry: SLARegistry = await ethers.getContract(
    CONTRACT_NAMES.SLARegistry
  );

  const details: Details = await ethers.getContract(CONTRACT_NAMES.Details);

  const stakeRegistry: StakeRegistry = await ethers.getContract(
    CONTRACT_NAMES.StakeRegistry
  );
  await dslaToken.mint(deployer, toWei(mintAmount));
  await dslaToken.mint(notDeployer, toWei(mintAmount));
  await dslaToken.approve(stakeRegistry.address, toWei(mintAmount));
  const iMessengerArtifact = await deployments.getArtifact(
    CONTRACT_NAMES.IMessenger
  );
  const mockMessenger = await deployMockContract(
    await ethers.getSigner(deployer),
    iMessengerArtifact.abi
  );
  await mockMessenger.mock.lpName.returns('UPTIME.ok');
  await mockMessenger.mock.spName.returns('UPTIME.ko');
  await mockMessenger.mock.lpSymbolSlaId.returns('UPTIME.ok-0');
  await mockMessenger.mock.spSymbolSlaId.returns('UPTIME.ko-0');

  const mockMessengerBis = await deployMockContract(
    await ethers.getSigner(deployer),
    iMessengerArtifact.abi
  );
  await mockMessengerBis.mock.lpName.returns('UPTIME.ok');
  await mockMessengerBis.mock.spName.returns('UPTIME.ko');
  await mockMessengerBis.mock.lpSymbolSlaId.returns('UPTIME.ok-0');
  await mockMessengerBis.mock.spSymbolSlaId.returns('UPTIME.ko-0');

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
  mockMessenger: IMessenger;
};

describe(CONTRACT_NAMES.Staking, function () {
  let fixture: Fixture;
  let deployer: string;
  let notDeployer: string;
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    notDeployer = (await getNamedAccounts()).notDeployer;
    fixture = await setup();
  });


  it('should perform staking long position for deployer', async () => {
    const { sla, dslaToken, details } = fixture;
    let tx = await sla.addAllowedTokens(dslaToken.address);
    await dslaToken.approve(sla.address, mintAmount);
    let stakeAmount = 100000;

    await expect(sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
      .to.emit(sla, 'Stake')
      .withArgs(
        dslaToken.address,
        await sla.nextVerifiablePeriod(),
        deployer,
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
    let tx = await sla.addAllowedTokens(dslaToken.address);
    await dslaToken.approve(sla.address, amount);

    // user long stake
    const notDeployerSLA = SLA__factory.connect(
      sla.address,
      await ethers.getSigner(notDeployer)
    );

    const notDeployerDSLA = ERC20PresetMinterPauser__factory.connect(
      dslaToken.address,
      await ethers.getSigner(notDeployer)
    );

    await notDeployerDSLA.approve(sla.address, amount * leverage);
    await notDeployerSLA.stakeTokens(
      amount * leverage,
      dslaToken.address,
      POSITION.OK
    );

    // provider long stake
    const deployerSLA = SLA__factory.connect(
      sla.address,
      await ethers.getSigner(deployer)
    );
    const deployerDSLA = ERC20PresetMinterPauser__factory.connect(
      dslaToken.address,
      await ethers.getSigner(deployer)
    );


    await deployerDSLA.approve(sla.address, amount * leverage);
    await expect(deployerSLA.stakeTokens(amount * leverage, dslaToken.address, POSITION.KO))
      .to.emit(sla, 'Stake')
      .withArgs(
        dslaToken.address,
        await sla.nextVerifiablePeriod(),
        deployer,
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
      .to.be.revertedWith('ERC20: transfer amount exceeds allowance')
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

  it('should prevent creation of a stacking contract if incorrect leverage', async () => {
    const { slaRegistry, dslaToken, mockMessenger } = fixture;
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

  it('should add allowed tokens in list if not yet present then perform staking', async () => {
    const { sla, dslaToken, details } = fixture;
    expect(sla.addAllowedTokens(dslaToken.address))
      .to.emit(sla, 'DTokensCreated');
  });

  it('should revert if token already present in allowedTokens', async () => {
    const { sla, dslaToken, details } = fixture;
    let tx = await sla.addAllowedTokens(dslaToken.address);
    await expect(sla.addAllowedTokens(dslaToken.address)).to.be.revertedWith('This token has been allowed already.');
  });

  describe("whitelist", function () {
    it('should perform staking for not whitelisted user if whitelist not activated', async () => {
      const { sla, sla_wl, dslaToken, details } = fixture;
      let tx = await sla.addAllowedTokens(dslaToken.address);
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;

      await expect(sla.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.emit(sla, 'Stake')
        .withArgs(
          dslaToken.address,
          await sla.nextVerifiablePeriod(),
          deployer,
          stakeAmount,
          POSITION.OK
        );
      let detailsarrs = (
        await details.getSLADetailsArrays(sla.address)
      )

      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());

    });

    it('should perform staking for contract owner even if whitelist is activated', async () => {
      // Contract Owner is added by default in whitelist, it's not needed to add it after contract creation
      const { sla_wl, dslaToken, details } = fixture;

      let tx = await sla_wl.addAllowedTokens(dslaToken.address);
      await dslaToken.approve(sla_wl.address, mintAmount);
      let stakeAmount = 100000;

      await expect(sla_wl.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.emit(sla_wl, 'Stake')
        .withArgs(
          dslaToken.address,
          await sla_wl.nextVerifiablePeriod(),
          deployer,
          stakeAmount,
          POSITION.OK
        );
      let detailsarrs = (
        await details.getSLADetailsArrays(sla_wl.address)
      )

      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());
    });


    it('should prevent staking for not whitelisted user if whitelist is activated', async () => {
      const { sla_wl, dslaToken, details } = fixture;
      let stakeAmount = 100000;
      await dslaToken.approve(sla_wl.address, stakeAmount);

      // user long stake
      const notDeployerSLA = SLA__factory.connect(
        sla_wl.address,
        await ethers.getSigner(notDeployer)
      );
      const notDeployerDSLA = ERC20PresetMinterPauser__factory.connect(
        dslaToken.address,
        await ethers.getSigner(notDeployer)
      );

      await notDeployerDSLA.approve(sla_wl.address, stakeAmount);
      await sla_wl.addAllowedTokens(dslaToken.address);
      await expect(notDeployerSLA.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.be.revertedWith('not whitelisted');
    });

    it('should perform staking for whitelisted user if whitelist is activated', async () => {
      const { sla_wl, dslaToken, details } = fixture;
      let stakeAmount = 100000;
      await dslaToken.approve(sla_wl.address, stakeAmount);

      // user long stake
      const notDeployerSLA = SLA__factory.connect(
        sla_wl.address,
        await ethers.getSigner(notDeployer)
      );

      const notDeployerDSLA = ERC20PresetMinterPauser__factory.connect(
        dslaToken.address,
        await ethers.getSigner(notDeployer)
      );

      await notDeployerDSLA.approve(sla_wl.address, stakeAmount);
      await sla_wl.addAllowedTokens(dslaToken.address);
      await sla_wl.addUsersToWhitelist([notDeployer])

      await expect(sla_wl.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.emit(sla_wl, 'Stake')
        .withArgs(
          dslaToken.address,
          await sla_wl.nextVerifiablePeriod(),
          deployer,
          stakeAmount,
          POSITION.OK
        );
      let detailsarrs = (
        await details.getSLADetailsArrays(sla_wl.address)
      )

      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());
    });

    it('should perform staking for whitelisted user then deny staking after removal from whitelist if it is activated', async () => {
      const { sla_wl, dslaToken, details } = fixture;
      let stakeAmount = 100000;
      await dslaToken.approve(sla_wl.address, stakeAmount);

      // user long stake
      const notDeployerSLA = SLA__factory.connect(
        sla_wl.address,
        await ethers.getSigner(notDeployer)
      );

      const notDeployerDSLA = ERC20PresetMinterPauser__factory.connect(
        dslaToken.address,
        await ethers.getSigner(notDeployer)
      );

      await notDeployerDSLA.approve(sla_wl.address, stakeAmount);
      await sla_wl.addAllowedTokens(dslaToken.address);
      await sla_wl.addUsersToWhitelist([notDeployer])

      await expect(sla_wl.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.emit(sla_wl, 'Stake')
        .withArgs(
          dslaToken.address,
          await sla_wl.nextVerifiablePeriod(),
          deployer,
          stakeAmount,
          POSITION.OK
        );
      let detailsarrs = (
        await details.getSLADetailsArrays(sla_wl.address)
      )

      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());

      await sla_wl.removeUsersFromWhitelist([notDeployer])
      await expect(notDeployerSLA.stakeTokens(stakeAmount, dslaToken.address, POSITION.OK))
        .to.be.revertedWith('not whitelisted');
    });
  });
});
