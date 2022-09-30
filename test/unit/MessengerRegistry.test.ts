import { ethers, waffle, deployments, getNamedAccounts } from 'hardhat';
import { MessengerRegistry, SLARegistry } from '../../typechain';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS } from '../../constants';
import { expect } from '../chai-setup';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { MockContract } from 'ethereum-waffle';

const { deployMockContract } = waffle;
const dummySpecUrl = 'http://dummy.link';

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
  let owner: SignerWithAddress;
  let user: SignerWithAddress;
  before(async function () {
    deployer = (await getNamedAccounts()).deployer;
    [owner, user,] = await ethers.getSigners();
  })
  beforeEach(async function () {
    fixture = await setup();
  });
  describe('Register Messenger', function () {
    it('should be able to set SLARegistry only once', async function () {
      const { messengerRegistry } = fixture;
      await expect(messengerRegistry.setSLARegistry())
        .to.be.revertedWith('SLARegistry address has already been set')
    })

    it('only SLARegistry can register messengers', async function () {
      const { messengerRegistry, mockMessenger } = fixture;
      await expect(
        messengerRegistry.registerMessenger(owner.address, mockMessenger.address, dummySpecUrl)
      ).to.be.revertedWith('Should only be called using the SLARegistry contract');
    });

    it('should register messengers with proper ids', async function () {
      const { messengerRegistry, mockMessenger, mockMessenger2, slaRegistry } =
        fixture;

      // First has id 0
      await expect(
        slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
      ).to.emit(messengerRegistry, 'MessengerRegistered')
        .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);

      // Second has id 1
      await expect(
        slaRegistry.registerMessenger(mockMessenger2.address, dummySpecUrl)
      ).to.emit(messengerRegistry, 'MessengerRegistered')
        .withArgs(deployer, mockMessenger2.address, dummySpecUrl, 10000, 1);
    });

    it('should revert messenger registration if it is already registered', async function () {
      const { messengerRegistry, mockMessenger, slaRegistry } = fixture;

      await expect(
        slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
      ).to.emit(messengerRegistry, 'MessengerRegistered')
        .withArgs(deployer, mockMessenger.address, dummySpecUrl, 10000, 0);
      await expect(
        slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
      ).to.be.revertedWith('messenger already registered')
    });

    it('should revert messenger registration if messenger address is invalid', async function () {
      const { slaRegistry } = fixture;
      // First has id 0
      await expect(
        slaRegistry.registerMessenger(ethers.constants.AddressZero, dummySpecUrl)
      ).to.be.revertedWith('invalid messenger address');
    });

    it('should revert messenger registration if messenger owner is not the caller', async function () {
      const { slaRegistry, mockMessenger } = fixture;
      // First has id 0
      await expect(
        slaRegistry.connect(user).registerMessenger(mockMessenger.address, dummySpecUrl)
      ).to.be.revertedWith('Should only be called by the messenger owner');
    });

    it("should revert messenger registration if messenger precision is 0 or not multiple of 100", async function () {
      const { mockMessenger, slaRegistry } = fixture;
      await mockMessenger.mock.messengerPrecision.returns(10001);

      await expect(
        slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
      ).to.be.revertedWith('invalid messenger precision, cannot register messanger');

      await mockMessenger.mock.messengerPrecision.returns(0);
      await expect(
        slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl)
      ).to.be.revertedWith('invalid messenger precision, cannot register messanger');
    })
  })

  describe('Modify Messenger', function () {
    it('should allow messenger modification only to the messenger owner', async function () {
      const { messengerRegistry, mockMessenger, slaRegistry } = fixture;
      await slaRegistry.registerMessenger(
        mockMessenger.address,
        dummySpecUrl
      );

      const dummySpecUrlModified = 'http://modifieddummy.link';
      await expect(messengerRegistry.connect(user).modifyMessenger(dummySpecUrlModified, '0'))
        .to.be.revertedWith('Can only be modified by the owner');
    })
    it('should modify messengers with valid id and specUrl', async function () {
      const { messengerRegistry, mockMessenger, slaRegistry } = fixture;
      // First has id 0
      await slaRegistry.registerMessenger(
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
      // First has id 0
      await slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl);
      const dummySpecUrlModified = 'http://modifieddummy.link';

      await expect(
        messengerRegistry.modifyMessenger(dummySpecUrlModified, '1')
      ).to.be.reverted;
    });

    it('should revert messengers with non valid id', async function () {
      const { messengerRegistry, mockMessenger, slaRegistry } = fixture;
      // First has id 0
      await slaRegistry.registerMessenger(mockMessenger.address, dummySpecUrl);
      const dummySpecUrlModified = 'http://modifieddummy.link';

      await expect(
        messengerRegistry.modifyMessenger(dummySpecUrlModified, '-1')
      ).to.be.reverted;
    });

  })

  describe('Utils', function () {

    it('should return empty list with no messengers ', async function () {
      const { messengerRegistry } = fixture;
      let messengersList = await messengerRegistry.getMessengers(0, 5);
      expect(messengersList).to.deep.equal([]);
    });

    it('should return a list of messengers with length 2 using getMessengers', async function () {
      const { messengerRegistry, mockMessenger, mockMessenger2, slaRegistry } =
        fixture;

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

    it("should return false because messenger isn't registered", async function () {
      const { messengerRegistry, mockMessenger } = fixture;

      let isRegisteredMessenger = await messengerRegistry.registeredMessengers(
        mockMessenger.address
      );
      expect(isRegisteredMessenger).to.be.false;
    });
  })
});
