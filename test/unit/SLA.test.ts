const hre = require('hardhat');
import {
  ERC20PresetMinterPauser,
  ERC20PresetMinterPauser__factory,
  SLA,
  SLA__factory,
  SLARegistry,
  StakeRegistry,
  Details,
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

const leverage = 10;
const baseSLAConfig = {
  sloValue: 50 * 10 ** 3,
  sloType: SLO_TYPE.GreaterThan,
  whitelisted: false,
  periodType: PERIOD_TYPE.WEEKLY,
  initialPeriodId: 0,
  finalPeriodId: 10,
  extraData: [SENetworkNamesBytes32[SENetworks.ONE]],
  governance: {
    leverage: leverage,
    cap: 1,
  },
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
    baseSLAConfig.governance
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
  };
});

type Fixture = {
  slaRegistry: SLARegistry;
  sla: SLA;
  dslaToken: ERC20PresetMinterPauser;
  details: Details;
};

describe(CONTRACT_NAMES.SLA, function () {
  let fixture: Fixture;
  let deployer: string;
  let notDeployer: string;
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    notDeployer = (await getNamedAccounts()).notDeployer;
    fixture = await setup();
  });

  it('should not let notDeployer withdraw tokens if the contract is not finished', async function () {
    const { sla, dslaToken, details } = fixture;
    await dslaToken.approve(sla.address, mintAmount);
    await sla.stakeTokens(mintAmount, dslaToken.address, 'long');
    const notDeployerSLA = SLA__factory.connect(
      sla.address,
      await ethers.getSigner(notDeployer)
    );

    const notDeployerDSLA = ERC20PresetMinterPauser__factory.connect(
      dslaToken.address,
      await ethers.getSigner(notDeployer)
    );
    await notDeployerDSLA.approve(sla.address, mintAmount);
    await notDeployerSLA.stakeTokens(mintAmount, dslaToken.address, 'long');
    const duTokenAddress = await sla.duTokenRegistry(dslaToken.address);
    const duToken: ERC20PresetMinterPauser = await ethers.getContractAt(
      'ERC20PresetMinterPauser',
      duTokenAddress,
      await ethers.getSigner(notDeployer)
    );
    await duToken.approve(sla.address, mintAmount);

    await expect(
      notDeployerSLA.withdrawUserTokens(mintAmount, dslaToken.address)
    ).to.be.reverted;
    let totalStake = (
      await details.getSLADetailsArrays(sla.address)
    ).tokensStake[0].totalStake.toString();
    expect(totalStake).equals((parseInt(mintAmount) * 2).toString());
  });

  it('should not let the deployer withdraw provider tokens if the contract is not finished', async () => {
    const { sla, dslaToken, details } = fixture;
    await dslaToken.approve(sla.address, mintAmount);
    await sla.stakeTokens(mintAmount, dslaToken.address, 'long');
    const deployerSLA = SLA__factory.connect(
      sla.address,
      await ethers.getSigner(deployer)
    );
    const deployerDSLA = ERC20PresetMinterPauser__factory.connect(
      dslaToken.address,
      await ethers.getSigner(deployer)
    );
    await deployerDSLA.approve(sla.address, mintAmount);
    await deployerSLA.stakeTokens(mintAmount, dslaToken.address, 'long');
    const duTokenAddress = await sla.dpTokenRegistry(dslaToken.address);
    const duToken: ERC20PresetMinterPauser = await ethers.getContractAt(
      'ERC20PresetMinterPauser',
      duTokenAddress,
      await ethers.getSigner(deployer)
    );
    await duToken.approve(sla.address, mintAmount);

    await expect(
      deployerSLA.withdrawProviderTokens(mintAmount, dslaToken.address)
    ).to.be.reverted;

    let totalStake = (
      await details.getSLADetailsArrays(sla.address)
    ).tokensStake[0].totalStake.toString();
    expect(totalStake).equals((parseInt(mintAmount) * 2).toString());
  });

  it('should check that a normal amount of token can be staked', async () => {
    const { sla, dslaToken, details } = fixture;
    await dslaToken.approve(sla.address, mintAmount);
    let stakeAmount = 100000;
    await expect(sla.stakeTokens(stakeAmount, dslaToken.address, 'long'))
      .to.emit(sla, 'Stake')
      .withArgs(
        dslaToken.address,
        await sla.nextVerifiablePeriod(),
        deployer,
        stakeAmount
      );
    let totalStake = (
      await details.getSLADetailsArrays(sla.address)
    ).tokensStake[0].totalStake.toString();
    expect(totalStake).equals(stakeAmount.toString());
  });

  it('should check that a negative amount of token cant be staked', async () => {
    const { sla, dslaToken, details } = fixture;
    await dslaToken.approve(sla.address, mintAmount);

    await expect(sla.stakeTokens(-1000, dslaToken.address, 'long')).to.be
      .reverted;
    let totalStake = (
      await details.getSLADetailsArrays(sla.address)
    ).tokensStake[0].totalStake.toString();
    expect(totalStake).equals('0');
  });

  it('should revert if number is overflowing', async () => {
    const { sla, dslaToken, details } = fixture;
    await dslaToken.approve(sla.address, mintAmount);
    let bigNumber = 10 ** 100000000000000000000000000000000;
    await expect(sla.stakeTokens(bigNumber, dslaToken.address, 'long')).to.be
      .reverted;

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

  it('checks that allowed period is being reverted if period is negative ', async () => {
    const { sla } = fixture;
    await expect(sla.isAllowedPeriod(-1)).to.be.reverted;
  });

  it('checks that allowed period is being reverted if period is too large', async () => {
    const { sla } = fixture;
    let bigNumber = 10 ** 100000000000000000000000000000000;
    await expect(sla.isAllowedPeriod(bigNumber)).to.be.reverted;
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
    await sla.stakeTokens(stakeAmount, dslaToken.address, 'long');

    let stakersLength = await sla.getStakersLength();
    expect(stakersLength).to.be.equal(1);
  });

  it('checks that the stakers length is 2 if there are are 2 stakers for short and long positions', async () => {
    const { sla, dslaToken } = fixture;
    let amount = 10000;
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
      'long'
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

    await deployerDSLA.approve(sla.address, amount);
    await deployerSLA.stakeTokens(amount, dslaToken.address, 'short');

    // check stakers length
    let stakersLength = await sla.getStakersLength();
    expect(stakersLength).to.be.equal(2);
  });

  it('should revert because the short position is larger than the long position', async () => {
    const { sla, dslaToken } = fixture;
    let amount = 10000;
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

    await notDeployerDSLA.approve(sla.address, amount);
    await notDeployerSLA.stakeTokens(amount, dslaToken.address, 'long');

    // provider long stake
    const deployerSLA = SLA__factory.connect(
      sla.address,
      await ethers.getSigner(deployer)
    );
    const deployerDSLA = ERC20PresetMinterPauser__factory.connect(
      dslaToken.address,
      await ethers.getSigner(deployer)
    );

    await deployerDSLA.approve(sla.address, amount);
    await expect(deployerSLA.stakeTokens(amount, dslaToken.address, 'short')).to
      .be.reverted;
  });
});
