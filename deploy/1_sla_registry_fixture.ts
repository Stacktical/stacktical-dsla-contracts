import { DeployOptionsBase } from 'hardhat-deploy/dist/types';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS, SENetworkNamesBytes32 } from '../constants';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { currentTimestamp, ONE_DAY } from '../test/helper';

module.exports = async ({
  getNamedAccounts,
  deployments,
  network,
  waffle,
  ethers,
}: HardhatRuntimeEnvironment) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, get } = deployments;
  const { deployMockContract } = waffle;
  const baseOptions: DeployOptionsBase = {
    from: deployer,
    log: true,
  };

  await deploy(CONTRACT_NAMES.StringUtils, baseOptions);

  await deploy(CONTRACT_NAMES.PeriodRegistry, baseOptions);
  const periodRegistryArtifact = await deployments.getArtifact(
    CONTRACT_NAMES.PeriodRegistry
  );
  const periodRegistry = await deployMockContract(
    await (ethers as any).getSigner(deployer),
    periodRegistryArtifact.abi
  );
  await periodRegistry.mock.isInitializedPeriod.returns(true);
  await periodRegistry.mock.periodIsFinished.returns(true);
  await periodRegistry.mock.isValidPeriod.returns(true);
  await periodRegistry.mock.getPeriodStartAndEnd.returns(currentTimestamp, currentTimestamp + ONE_DAY);

  await deploy(CONTRACT_NAMES.MessengerRegistry, baseOptions);
  await deploy(CONTRACT_NAMES.SLORegistry, baseOptions);
  await deploy(CONTRACT_NAMES.DSLA, {
    ...baseOptions,
    contract: 'ERC20PresetMinterPauser',
    args: [CONTRACT_NAMES.DSLA, CONTRACT_NAMES.DSLA],
  });
  const { address: dslaTokenAddress } = await get(CONTRACT_NAMES.DSLA);

  await deploy(CONTRACT_NAMES.StakeRegistry, {
    ...baseOptions,
    args: [dslaTokenAddress],
  });
  const sloRegistry = await ethers.getContract(CONTRACT_NAMES.SLORegistry);
  const stakeRegistry = await ethers.getContract(CONTRACT_NAMES.StakeRegistry);
  const messengerRegistry = await ethers.getContract(CONTRACT_NAMES.MessengerRegistry);
  const stringUtils = await ethers.getContract(CONTRACT_NAMES.StringUtils);
  const checkPastPeriods = false;
  await deploy(CONTRACT_NAMES.SLARegistry, {
    ...baseOptions,
    args: [
      sloRegistry.address,
      periodRegistry.address,
      messengerRegistry.address,
      stakeRegistry.address,
      checkPastPeriods,
    ],
    libraries: {
      StringUtils: stringUtils.address,
    },
  });
  await deploy(CONTRACT_NAMES.Details, {
    ...baseOptions
  });
};

module.exports.tags = [DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE];
