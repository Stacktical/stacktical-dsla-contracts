import { DeployOptionsBase } from 'hardhat-deploy/dist/types';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS, PERIOD_TYPE, SENetworkNamesBytes32 } from '../constants';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { currentTimestamp, ONE_DAY } from '../test/helper';
const moment = require('moment');

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
  const periodRegistry = await ethers.getContract(CONTRACT_NAMES.PeriodRegistry);
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

  const periodStart = moment()
    .utc(0)
    .startOf('month')
    .add(10, 'month')
    .startOf('month')
    .unix();
  await periodRegistry.initializePeriod(
    PERIOD_TYPE.DAILY,
    [periodStart],
    [periodStart + 1000]
  );
  await periodRegistry.addPeriodsToPeriodType(
    PERIOD_TYPE.DAILY,
    [periodStart + 1001],
    [periodStart + 2000]
  );
  await periodRegistry.initializePeriod(
    PERIOD_TYPE.WEEKLY,
    [periodStart],
    [periodStart + 1000]
  );
  await periodRegistry.addPeriodsToPeriodType(
    PERIOD_TYPE.WEEKLY,
    [periodStart + 1001],
    [periodStart + 2000]
  );
};

module.exports.tags = [DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE];
