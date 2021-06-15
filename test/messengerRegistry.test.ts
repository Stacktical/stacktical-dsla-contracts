import { MessengerRegistry } from '../typechain';

const hre = require('hardhat');

const { ethers, waffle, deployments, getNamedAccounts } = hre;
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../constants';
import { expect } from 'chai';

const setup = deployments.createFixture(async () => {
  await deployments.fixture(DEPLOYMENT_TAGS.DSLA);
  const { deployer } = await getNamedAccounts();
  let messengerRegistry: MessengerRegistry = await ethers.getContract(
    CONTRACT_NAMES.MessengerRegistry
  );
  // Set deployer as SLARegistry
  const tx = await messengerRegistry.setSLARegistry({ from: deployer });
  await tx.wait();
  return {
    messengerRegistry,
  };
});

type Fixture = { messengerRegistry: MessengerRegistry };

describe(CONTRACT_NAMES.MessengerRegistry, function () {
  let fixture: Fixture;
  let deployer: string;
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    fixture = await setup();
  });

  it('should register first messenger with id 0', async function () {
    const { messengerRegistry } = fixture;
    await expect(
      messengerRegistry.registerMessenger(
        deployer,
        deployer,
        'http://dummy.link'
      )
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs([]);
  });
});
