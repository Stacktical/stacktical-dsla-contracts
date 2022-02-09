const hre = require('hardhat');
import {
  ERC20PresetMinterPauser,
  ERC20PresetMinterPauser__factory,
  SLA,
  SLA__factory,
  SLARegistry,
  StakeRegistry,
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
  };
});

type Fixture = {
  slaRegistry: SLARegistry;
  sla: SLA;
  dslaToken: ERC20PresetMinterPauser;
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

  it('should let notDeployer withdraw tokens if deployer unlocks contract', async function () {
    const { sla, dslaToken } = fixture;
    await dslaToken.approve(sla.address, mintAmount);
    await sla.stakeTokens(mintAmount, dslaToken.address);
    const notDeployerSLA = await SLA__factory.connect(
      sla.address,
      await ethers.getSigner(notDeployer)
    );
    const notDeployerDSLA = await ERC20PresetMinterPauser__factory.connect(
      dslaToken.address,
      await ethers.getSigner(notDeployer)
    );
    await notDeployerDSLA.approve(sla.address, mintAmount);
    await notDeployerSLA.stakeTokens(mintAmount, dslaToken.address);
    const duTokenAddress = await sla.duTokenRegistry(dslaToken.address);
    const duToken: ERC20PresetMinterPauser = await ethers.getContractAt(
      'ERC20PresetMinterPauser',
      duTokenAddress,
      await ethers.getSigner(notDeployer)
    );
    await duToken.approve(sla.address, mintAmount);
    await expect(
      notDeployerSLA.withdrawUserTokens(mintAmount, dslaToken.address)
    ).to.be.revertedWith('not finished');
    await sla.toggleUserWithdrawLocked();
    await expect(
      notDeployerSLA.withdrawUserTokens(mintAmount, dslaToken.address)
    )
      .to.emit(sla, 'UserWithdraw')
      .withArgs(
        dslaToken.address,
        await sla.nextVerifiablePeriod(),
        notDeployer,
        mintAmount
      );
  });

  it('should let the deployer withdraw tokens', async () => {
    const { sla, dslaToken } = fixture;
    await dslaToken.approve(sla.address, mintAmount);
    await sla.stakeTokens(mintAmount, dslaToken.address);
    const deployerSLA = await SLA__factory.connect(
      sla.address,
      await ethers.getSigner(deployer)
    );
    const deployerDSLA = await ERC20PresetMinterPauser__factory.connect(
      dslaToken.address,
      await ethers.getSigner(deployer)
    );
    await deployerDSLA.approve(sla.address, mintAmount);
    await deployerSLA.stakeTokens(mintAmount, dslaToken.address);
    const duTokenAddress = await sla.dpTokenRegistry(dslaToken.address);
    const duToken: ERC20PresetMinterPauser = await ethers.getContractAt(
      'ERC20PresetMinterPauser',
      duTokenAddress,
      await ethers.getSigner(deployer)
    );
    await duToken.approve(sla.address, mintAmount);

    await expect(
      deployerSLA.withdrawProviderTokens(mintAmount, dslaToken.address)
    )
      .to.emit(sla, 'ProviderWithdraw')
      .withArgs(
        dslaToken.address,
        await sla.nextVerifiablePeriod(),
        deployer,
        mintAmount
      );
  });
});
