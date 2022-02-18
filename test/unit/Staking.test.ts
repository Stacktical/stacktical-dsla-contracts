const hre = require('hardhat');
import{
    ERC20PresetMinterPauser,
    ERC20PresetMinterPauser__factory,
    SLA,
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

  describe(CONTRACT_NAMES.Staking, function () {
    let fixture: Fixture;
    let deployer: string;
    let notDeployer: string;
    beforeEach(async function () {
      deployer = (await getNamedAccounts()).deployer;
      notDeployer = (await getNamedAccounts()).notDeployer;
      fixture = await setup();
    });

    
    it('should perform staking long position', async () => {
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
      let detailsarrs = (
        await details.getSLADetailsArrays(sla.address)
      )
      
      let totalStake = detailsarrs.tokensStake[0].totalStake.toString();
      expect(totalStake).equals(stakeAmount.toString());
    });

    it('should prevent staking in case of invalid token address', async () => {
      const { sla, dslaToken, details } = fixture;
      await dslaToken.approve(sla.address, mintAmount);
      let stakeAmount = 100000;
      const invalidTokenAddress = "0x61A12"
      await expect(sla.stakeTokens(stakeAmount, invalidTokenAddress, 'long'))
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

    it('should generate a reward after reached SL staking period', async () => {
      const { sla, dslaToken, details } = fixture;
      const sliValueReached = baseSLAConfig['sloValue'] + 1
      const finalPeriodId = baseSLAConfig['finalPeriodId']
      //mockMessenger.address

      // should use the messenger to register sli ?
      let sliRegistered = await sla.registerSLI(sliValueReached, finalPeriodId);

      expect(sliRegistered)
      .to.emit(sla, 'ProviderRewardGenerated')
      .withArgs(
        await sla.nextVerifiablePeriod(), // await sla.nextVerifiablePeriod()
        dslaToken.address
      );
    });



});
  