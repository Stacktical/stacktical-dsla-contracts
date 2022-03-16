import { DeployOptionsBase } from 'hardhat-deploy/dist/types';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../constants';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

module.exports = async ({
  getNamedAccounts,
  deployments,
  network,
}: HardhatRuntimeEnvironment) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, get } = deployments;
  const baseOptions: DeployOptionsBase = {
    from: deployer,
    log: true,
  };

  await deploy(CONTRACT_NAMES.StringUtils, baseOptions);
  await deploy(CONTRACT_NAMES.SLAFactory, baseOptions);
  await deploy(CONTRACT_NAMES.PeriodRegistry, baseOptions);
  await deploy(CONTRACT_NAMES.SLORegistry, baseOptions);
  await deploy(CONTRACT_NAMES.MessengerRegistry, baseOptions);
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
  const periodRegistry = await get(CONTRACT_NAMES.PeriodRegistry);
  const sloRegistry = await get(CONTRACT_NAMES.SLORegistry);
  const messengerRegistry = await get(CONTRACT_NAMES.MessengerRegistry);
  const stakeRegistry = await get(CONTRACT_NAMES.StakeRegistry);
  const stringUtils = await get(CONTRACT_NAMES.StringUtils);
  const slaFactory = await get(CONTRACT_NAMES.SLAFactory);

  const checkPastPeriods = false;
  await deploy(CONTRACT_NAMES.SLARegistry, {
    ...baseOptions,
    ...(network.config.gas !== 'auto' && { gasLimit: network.config.gas }),
    args: [
      sloRegistry.address,
      periodRegistry.address,
      messengerRegistry.address,
      stakeRegistry.address,
      slaFactory.address,
      checkPastPeriods,
    ],
    libraries: {
      StringUtils: stringUtils.address,
    },
  });
};

module.exports.tags = [DEPLOYMENT_TAGS.DSLA];
