import { DeployOptionsBase } from 'hardhat-deploy/dist/types';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../constants';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

module.exports = async ({
  getNamedAccounts,
  deployments,
  network,
}: HardhatRuntimeEnvironment) => {
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;
  const baseOptions: DeployOptionsBase = {
    from: deployer,
    log: true,
  };

  await deploy(CONTRACT_NAMES.MessengerRegistry, baseOptions);
};

module.exports.tags = [DEPLOYMENT_TAGS.DSLA];
