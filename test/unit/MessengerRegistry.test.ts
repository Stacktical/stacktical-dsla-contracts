import { IMessenger, MessengerRegistry, SLARegistry } from '../../typechain';
import { ethers, waffle, deployments, getNamedAccounts } from 'hardhat';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../../constants';
const { deployMockContract } = waffle;
import { expect } from '../chai-setup';
import { MockContract } from 'ethereum-waffle';
import { ethers as Ethers } from 'ethers';

const setup = deployments.createFixture(async () => {
  await deployments.fixture(DEPLOYMENT_TAGS.DSLA);
  const { deployer } = await getNamedAccounts();
  const messengerRegistry: MessengerRegistry = await ethers.getContract(
    CONTRACT_NAMES.MessengerRegistry
  );
  const slaRegistry: SLARegistry = await ethers.getContract(
    CONTRACT_NAMES.SLARegistry
  );
  // Set deployer as SLARegistry
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
  // Mock interfaces to return proper values
  await mockMessenger.mock.owner.returns(deployer);
  await mockMessenger.mock.messengerPrecision.returns(10000);
  await mockMessenger.mock.requestsCounter.returns(0);
  await mockMessenger.mock.fulfillsCounter.returns(0);
  await mockMessenger.mock.setSLARegistry.returns();
  await mockMessenger2.mock.owner.returns(deployer);
  await mockMessenger2.mock.messengerPrecision.returns(10000);
  await mockMessenger2.mock.requestsCounter.returns(0);
  await mockMessenger2.mock.fulfillsCounter.returns(0);
  await mockMessenger2.mock.setSLARegistry.returns();
  return {
    slaRegistry,
    messengerRegistry,
    mockMessenger,
    mockMessenger2,
  };
});

type Fixture = {
  messengerRegistry: MessengerRegistry;
  slaRegistry: SLARegistry;
  mockMessenger: MockContract;
  mockMessenger2: MockContract;
};

describe(CONTRACT_NAMES.MessengerRegistry, function () {
  let fixture: Fixture;
  let deployer: string;
  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    fixture = await setup();
  });

  it('should register messengers with proper ids', async function () {
    const { messengerRegistry, mockMessenger, mockMessenger2, slaRegistry } =
      fixture;
    const dummySpecUrl = 'http://dummy.link';

    // First has id 0
    await expect(
      slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);

    // Second has id 1
    await expect(
      slaRegistry.registerMessenger(mockMessenger2.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger2.address, dummySpecUrl, 10000, 1);
  });

  it('should revert messengers with non valid address', async function () {
    const { slaRegistry } = fixture;
    const dummySpecUrl = 'http://dummy.link';
    const invalidAddress = dummySpecUrl;
    // First has id 0
    await expect(
      slaRegistry.registerMessenger(invalidAddress, dummySpecUrl)
    ).to.be.reverted;

    await expect(
      slaRegistry.registerMessenger(Ethers.constants.AddressZero, dummySpecUrl)
    ).to.be.revertedWith('invalid messenger address')
  });

  it('should modify messengers with valid id and specUrl', async function () {
    const { messengerRegistry, mockMessenger, slaRegistry } = fixture;
    const dummySpecUrl = 'http://dummy.link';
    // First has id 0
    let messangerEmit = await slaRegistry.registerMessenger(
      mockMessenger.address,
      dummySpecUrl
    );
    const dummySpecUrlModified = 'http://modifieddummy.link';

    await expect(messengerRegistry.modifyMessenger(dummySpecUrlModified, '0'))
      .to.emit(messengerRegistry, 'MessengerModified')
      .withArgs(
        deployer,
        mockMessenger.address,
        dummySpecUrlModified,
        10000,
        0
      );
  });

  it('should revert messengers with valid non existent id', async function () {
    const { messengerRegistry, mockMessenger, slaRegistry } = fixture;
    const dummySpecUrl = 'http://dummy.link';
    // First has id 0
    await slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl);
    const dummySpecUrlModified = 'http://modifieddummy.link';

    await expect(
      messengerRegistry.modifyMessenger(dummySpecUrlModified, '1')
    ).to.be.reverted;
  });

  it('should revert messengers with non valid id', async function () {
    const { messengerRegistry, mockMessenger, slaRegistry } = fixture;
    const dummySpecUrl = 'http://dummy.link';
    // First has id 0
    await slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl);
    const dummySpecUrlModified = 'http://modifieddummy.link';

    await expect(
      messengerRegistry.modifyMessenger(dummySpecUrlModified, '-1')
    ).to.be.reverted;
  });

  it('should return empty list with no messengers ', async function () {
    const { messengerRegistry } = fixture;
    let messengersList = await messengerRegistry.getMessengers(0, 5);
    expect(messengersList).to.deep.equal([]);
  });

  it('should return a list of messengers with length 2 using getMessengers', async function () {
    const { messengerRegistry, mockMessenger, mockMessenger2, slaRegistry } =
      fixture;
    const dummySpecUrl = 'http://dummy.link';

    // First has id 0
    await expect(
      slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);

    // Second has id 1
    await expect(
      slaRegistry.registerMessenger(mockMessenger2.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger2.address, dummySpecUrl, 10000, 1);

    let messengersList = await messengerRegistry.getMessengers(0, 5);
    expect(messengersList.length).to.equal(2);
  });

  it('should return a list of messengers with length 1 from 2nd using getMessengers', async function () {
    const { messengerRegistry, mockMessenger, mockMessenger2, slaRegistry } =
      fixture;
    const dummySpecUrl = 'http://dummy.link';

    // First has id 0
    await expect(
      slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);

    // Second has id 1
    await expect(
      slaRegistry.registerMessenger(mockMessenger2.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger2.address, dummySpecUrl, 10000, 1);

    let messengersList = await messengerRegistry.getMessengers(1, 5);
    expect(messengersList.length).to.equal(1);
    expect(messengersList[0].messengerAddress).to.be.equal(mockMessenger2.address)
  });

  it('should return a list of messengers with length 2 using getMessengersLength', async function () {
    const { messengerRegistry, mockMessenger, mockMessenger2, slaRegistry } =
      fixture;
    const dummySpecUrl = 'http://dummy.link';

    // First has id 0
    await expect(
      slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);

    // Second has id 1
    await expect(
      slaRegistry.registerMessenger(mockMessenger2.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger2.address, dummySpecUrl, 10000, 1);

    let messengersLength = await messengerRegistry.getMessengersLength();
    expect(messengersLength).to.equal('2');
  });

  it('should return list with length 0 ', async function () {
    const { messengerRegistry } = fixture;
    let messengersLength = await messengerRegistry.getMessengersLength();
    expect(messengersLength).to.equal('0');
  });

  it('should return true because messenger is registered', async function () {
    const { messengerRegistry, mockMessenger, slaRegistry } = fixture;

    const dummySpecUrl = 'http://dummy.link';
    // First has id 0
    await expect(
      slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
    )
      .to.emit(messengerRegistry, 'MessengerRegistered')
      .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);

    let isRegisteredMessenger = await messengerRegistry.registeredMessengers(
      mockMessenger.address
    );
    expect(isRegisteredMessenger).to.be.true;
  });

  it('should return false because messenger isnt registered', async function () {
    const { messengerRegistry, mockMessenger } = fixture;

    let isRegisteredMessenger = await messengerRegistry.registeredMessengers(
      mockMessenger.address
    );
    expect(isRegisteredMessenger).to.be.false;
  });
});
