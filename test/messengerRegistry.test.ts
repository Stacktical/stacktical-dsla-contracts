const hre = require('hardhat');
import { IMessenger, MessengerRegistry } from '../typechain';
const { ethers, waffle, deployments, getNamedAccounts } = hre;
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../constants';
const { deployMockContract } = waffle;
import { expect } from './chai-setup';

const setup = deployments.createFixture(async () => {
  await deployments.fixture(DEPLOYMENT_TAGS.DSLA);
  const { deployer } = await getNamedAccounts();
  let messengerRegistry: MessengerRegistry = await ethers.getContract(
    CONTRACT_NAMES.MessengerRegistry
  );
  // Set deployer as SLARegistry
  const tx = await messengerRegistry.setSLARegistry({ from: deployer });
  await tx.wait();
  const iMessengerArtifact = await deployments.getArtifact(
    CONTRACT_NAMES.IMessenger
  );
  const mockMessenger = await deployMockContract(
    await ethers.getSigner(deployer),
    iMessengerArtifact.abi
  );
  const mockMessenger2 = await deployMockContract(
    await ethers.getSigner(deployer),
    iMessengerArtifact.abi
  );
  // Mock messenger to return proper values
  await mockMessenger.mock.owner.returns(deployer);
  await mockMessenger.mock.messengerPrecision.returns(10000);
  await mockMessenger.mock.requestsCounter.returns(0);
  await mockMessenger.mock.fulfillsCounter.returns(0);
  await mockMessenger2.mock.owner.returns(deployer);
  await mockMessenger2.mock.messengerPrecision.returns(10000);
  await mockMessenger2.mock.requestsCounter.returns(0);
  await mockMessenger2.mock.fulfillsCounter.returns(0);
  return {
    messengerRegistry,
    mockMessenger,
    mockMessenger2,
  };
});

type Fixture = {
  messengerRegistry: MessengerRegistry;
  mockMessenger: IMessenger;
  mockMessenger2: IMessenger;
};

describe(CONTRACT_NAMES.MessengerRegistry, function () {
  let fixture: Fixture;
  let deployer: string;
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    fixture = await setup();
  });

  it('should register messengers with proper ids', async function () {
    const { messengerRegistry, mockMessenger, mockMessenger2 } = fixture;
    const dummySpecUrl = 'http://dummy.link';

    // First has id 0
    await expect(
      messengerRegistry.registerMessenger(
        deployer,
        mockMessenger.address,
        dummySpecUrl
      )
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);

    // Second has id 1
    await expect(
      messengerRegistry.registerMessenger(
        deployer,
        mockMessenger2.address,
        dummySpecUrl
      )
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger2.address, dummySpecUrl, 10000, 1);
  });
});
