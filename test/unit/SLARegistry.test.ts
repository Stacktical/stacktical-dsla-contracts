import { ethers, deployments, getNamedAccounts } from 'hardhat';
import { expect } from '../chai-setup';
import { BigNumber, BytesLike, utils } from 'ethers';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS, SENetworkNamesBytes32, SENetworks, PERIOD_TYPE, SLO_TYPE } from '../../constants';
import { toWei } from 'web3-utils';
import {
	ERC20PresetMinterPauser,
	MessengerRegistry,
	MockMessenger,
	PeriodRegistry,
	SLA,
	SLARegistry,
	SLA__factory,
	SLORegistry,
	StakeRegistry
} from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { currentTimestamp, evm_increaseTime, ONE_DAY } from '../helper';

type Fixture = {
	sloRegistry: SLORegistry;
	slaRegistry: SLARegistry;
	stakeRegistry: StakeRegistry;
	periodRegistry: PeriodRegistry;
	messengerRegistry: MessengerRegistry;
	dslaToken: ERC20PresetMinterPauser;
};
interface SLAConfig {
	sloValue: number,
	sloType: SLO_TYPE,
	whitelisted: boolean,
	periodType: PERIOD_TYPE,
	initialPeriodId: number,
	finalPeriodId: number,
	extraData: BytesLike[],
	leverage: number
}
const baseSLAConfig: SLAConfig = {
	sloValue: 50 * 10 ** 3,
	sloType: SLO_TYPE.GreaterThan,
	whitelisted: false,
	periodType: PERIOD_TYPE.WEEKLY,
	initialPeriodId: 0,
	finalPeriodId: 10,
	extraData: [SENetworkNamesBytes32[SENetworks.ONE]],
	leverage: 10,
};
const mintAmount = utils.parseEther('1000000');

const setup = deployments.createFixture(async () => {
	await deployments.fixture(DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE);
	const slaRegistry: SLARegistry = await ethers.getContract(
		CONTRACT_NAMES.SLARegistry
	);
	const sloRegistry: SLORegistry = await ethers.getContract(
		CONTRACT_NAMES.SLORegistry
	);
	const stakeRegistry: StakeRegistry = await ethers.getContract(
		CONTRACT_NAMES.StakeRegistry
	);
	const periodRegistry: PeriodRegistry = await ethers.getContractAt(
		CONTRACT_NAMES.PeriodRegistry, await slaRegistry.periodRegistry()
	);
	const messengerRegistry: MessengerRegistry = await ethers.getContract(
		CONTRACT_NAMES.MessengerRegistry
	);
	const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
		CONTRACT_NAMES.DSLA
	);
	return {
		sloRegistry,
		slaRegistry,
		stakeRegistry,
		periodRegistry,
		messengerRegistry,
		dslaToken,
	};
});

const deployMessenger = async (
	deployer: string
) => {
	const slaRegistry: SLARegistry = await ethers.getContract(
		CONTRACT_NAMES.SLARegistry
	);
	const stakeRegistry: StakeRegistry = await ethers.getContract(
		CONTRACT_NAMES.StakeRegistry
	);
	const periodRegistry: PeriodRegistry = await ethers.getContractAt(
		CONTRACT_NAMES.PeriodRegistry, await slaRegistry.periodRegistry()
	);
	// deploy mock messenger
	const tx = await deployments.deploy(CONTRACT_NAMES.MockMessenger, {
		from: deployer,
		log: true,
		args: [
			ethers.constants.AddressZero,
			ethers.constants.AddressZero,
			1,
			periodRegistry.address,
			stakeRegistry.address,
			SENetworkNamesBytes32[SENetworks.ONE],
			'UPTIME.ok',
			'UPTIME.ok',
			'UPTIME.ko',
			'UPTIME.ko',
		]
	})
	const mockMessenger: MockMessenger = await ethers.getContractAt(CONTRACT_NAMES.MockMessenger, tx.address);
	return mockMessenger;
}

const deploySLA = async (slaConfig: SLAConfig) => {
	await deployments.fixture(DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE);
	const slaRegistry: SLARegistry = await ethers.getContract(
		CONTRACT_NAMES.SLARegistry
	);
	const stakeRegistry: StakeRegistry = await ethers.getContract(
		CONTRACT_NAMES.StakeRegistry
	);
	const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
		CONTRACT_NAMES.DSLA
	);
	const { deployer, notDeployer } = await getNamedAccounts();
	await dslaToken.mint(deployer, mintAmount);
	await dslaToken.mint(notDeployer, mintAmount);
	await dslaToken.approve(stakeRegistry.address, ethers.constants.MaxUint256);

	// deploy mock messenger
	const mockMessenger = await deployMessenger(deployer)
	await slaRegistry.registerMessenger(mockMessenger.address, 'dummy link');

	let tx = await slaRegistry.createSLA(
		slaConfig.sloValue,
		slaConfig.sloType,
		slaConfig.whitelisted,
		mockMessenger.address,
		slaConfig.periodType,
		slaConfig.initialPeriodId,
		slaConfig.finalPeriodId,
		'dummy-ipfs-hash',
		slaConfig.extraData,
		slaConfig.leverage
	)
	await tx.wait();

	return mockMessenger;
}

describe(CONTRACT_NAMES.SLARegistry, function () {
	let fixture: Fixture;
	let owner: SignerWithAddress;
	let user: SignerWithAddress;
	before(async () => {
		[owner, user,] = await ethers.getSigners();
	})
	beforeEach(async function () {
		fixture = await setup();
	});
	describe('constructor', function () {
		it('should be able to deploy SLARegistry with proper addresses of other contracts', async () => {
			const { slaRegistry, sloRegistry, periodRegistry } = fixture;
			const { deploy } = deployments;
			await expect(deploy(CONTRACT_NAMES.SLARegistry, {
				from: owner.address,
				log: true,
				args: [
					ethers.constants.AddressZero,
					ethers.constants.AddressZero,
					ethers.constants.AddressZero,
					ethers.constants.AddressZero,
					false,
				],
			})).to.be.revertedWith('invalid sloRegistry address');
			await expect(deploy(CONTRACT_NAMES.SLARegistry, {
				from: owner.address,
				log: true,
				args: [
					sloRegistry.address,
					ethers.constants.AddressZero,
					ethers.constants.AddressZero,
					ethers.constants.AddressZero,
					false,
				],
			})).to.be.revertedWith('invalid periodRegistry address');
			await expect(deploy(CONTRACT_NAMES.SLARegistry, {
				from: owner.address,
				log: true,
				args: [
					sloRegistry.address,
					periodRegistry.address,
					ethers.constants.AddressZero,
					ethers.constants.AddressZero,
					false,
				],
			})).to.be.revertedWith('invalid messengerRegistry address');
			const messengerRegistryAddr = await slaRegistry.messengerRegistry();
			await expect(deploy(CONTRACT_NAMES.SLARegistry, {
				from: owner.address,
				log: true,
				args: [
					sloRegistry.address,
					periodRegistry.address,
					messengerRegistryAddr,
					ethers.constants.AddressZero,
					false,
				],
			})).to.be.revertedWith('invalid stakeRegistry address');
		})
	})
	describe('create sla', function () {
		it("should be able to create sla by anyone", async () => {
			const { slaRegistry, stakeRegistry, periodRegistry } = fixture;
			const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
				CONTRACT_NAMES.DSLA
			);
			const { deployer, notDeployer } = await getNamedAccounts();

			// deploy mock messenger
			const mockMessenger = await deployMessenger(deployer)
			await slaRegistry.registerMessenger(mockMessenger.address, 'dummy link');

			// Approve dsla tokens to lock on stake registry
			await dslaToken.mint(deployer, mintAmount);
			await dslaToken.mint(notDeployer, mintAmount);
			await dslaToken.approve(stakeRegistry.address, ethers.constants.MaxUint256);

			await expect(slaRegistry.createSLA(
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
			)).to.emit(slaRegistry, "SLACreated");
		})
		it('should lock dsla tokens from sla owner', async () => {
			const { slaRegistry, stakeRegistry, periodRegistry } = fixture;
			const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
				CONTRACT_NAMES.DSLA
			);
			const { deployer, notDeployer } = await getNamedAccounts();

			// deploy mock messenger
			const mockMessenger = await deployMessenger(deployer)
			await slaRegistry.registerMessenger(mockMessenger.address, 'dummy link');

			// Approve dsla tokens to lock on stake registry
			await dslaToken.mint(deployer, mintAmount);
			await dslaToken.mint(notDeployer, mintAmount);
			await dslaToken.approve(stakeRegistry.address, ethers.constants.MaxUint256);

			await expect(slaRegistry.createSLA(
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
			)).to.emit(stakeRegistry, "ValueLocked");

			// StakeRegistry should take the balance
			const lockedDSLA = utils.parseEther('1000').mul(baseSLAConfig.finalPeriodId - baseSLAConfig.initialPeriodId + 1);
			expect(await dslaToken.balanceOf(deployer)).to.be.equal(mintAmount.sub(lockedDSLA))
		})
	})
	describe('request sli', function () {
		it('should rever requesting sli if SLA address is not registered', async () => {
			const { slaRegistry } = fixture;
			await expect(slaRegistry.requestSLI(
				0,
				ethers.constants.AddressZero,
				false
			)).to.be.revertedWith('This SLA is not valid.');
		})
		it("should revert if period id is not the next verifiable period id", async () => {
			const { slaRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			await expect(slaRegistry.requestSLI(
				1,
				slaAddress,
				false
			)).to.be.revertedWith('not nextVerifiablePeriod');
		})
		it("should revert if period id is not allowed period", async () => {
			const { slaRegistry } = fixture;
			await deploySLA({ ...baseSLAConfig });
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress);
			const finalPeriodId = await sla.finalPeriodId();
			await expect(slaRegistry.requestSLI(
				finalPeriodId,
				slaAddress,
				false
			)).to.be.revertedWith('not nextVerifiablePeriod');
		})
		it("should be able to request sli", async () => {
			const { slaRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla = await SLA__factory.connect(slaAddress, owner);
			const nextVerifiablePeriod = await sla.nextVerifiablePeriod();
			await expect(slaRegistry.requestSLI(
				Number(nextVerifiablePeriod),
				slaAddress,
				false
			)).to.emit(slaRegistry, "SLIRequested");
		})
	})
	describe('message registration', function () {
		it("should able to register new messenger", async () => {
			const { slaRegistry, messengerRegistry } = fixture;

			// deploy mock messenger
			const mockMessenger = await deployMessenger(owner.address)
			await expect(slaRegistry.registerMessenger(mockMessenger.address, 'dummy link'))
				.to.be.emit(messengerRegistry, 'MessengerRegistered');
		})
	})
	describe('return locked value', function () {
		it("should revert returning locked value when sla is not registered", async () => {
			const { slaRegistry } = fixture;
			await expect(slaRegistry.returnLockedValue(owner.address))
				.to.be.revertedWith("This SLA is not valid.");
		})
		it("should revert returning locked value when it is called from not-owner address", async () => {
			const { slaRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			await expect(slaRegistry.connect(user).returnLockedValue(
				slaAddress
			)).to.be.revertedWith("Only the SLA owner can do this.");
		})
		it("should revert returning locked value when sla contract is not finished yet.", async () => {
			const { slaRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			await expect(slaRegistry.returnLockedValue(
				slaAddress
			)).to.be.revertedWith("This SLA has not terminated.");
		})
		it("should revert if no locked tokens", async () => {
			const { slaRegistry } = fixture;
			const mockMessenger = await deploySLA({
				...baseSLAConfig, finalPeriodId: 0
			});
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			const sla = await SLA__factory.connect(slaAddress, owner);
			const lastPeriodId = await sla.finalPeriodId();
			await slaRegistry.requestSLI(lastPeriodId, slaAddress, true);
			await expect(mockMessenger.mockFulfillSLI(lastPeriodId, 100))
				.to.be.emit(sla, 'SLICreated');

			await evm_increaseTime(currentTimestamp + ONE_DAY);
			expect(await sla.contractFinished()).to.be.true;
			await expect(slaRegistry.returnLockedValue(slaAddress))
				.to.be.revertedWith('locked value is empty')
		})
		it("should return locked value after sla contract has finished", async () => {
			const { slaRegistry, stakeRegistry, dslaToken } = fixture;

			// deploy messenger and create sla
			const mockMessenger = await deploySLA({
				...baseSLAConfig,
				finalPeriodId: 1
			})
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const lockedValue = await stakeRegistry.slaLockedValue(slaAddress)
			console.log(lockedValue, lockedValue.lockedValue)

			// request sli and fulfill sli
			const sla = await SLA__factory.connect(slaAddress, owner);
			await slaRegistry.requestSLI(0, slaAddress, true);
			await expect(mockMessenger.mockFulfillSLI(0, 100))
				.to.be.emit(sla, 'SLICreated');

			await slaRegistry.requestSLI(1, slaAddress, true);
			await expect(mockMessenger.mockFulfillSLI(1, 100))
				.to.be.emit(sla, 'SLICreated');

			await evm_increaseTime(currentTimestamp + ONE_DAY);
			expect(await sla.contractFinished()).to.be.true;

			// 2 periods verified, and locked value should be empty
			await expect(slaRegistry.returnLockedValue(slaAddress))
				.to.be.revertedWith('locked value is empty')
		})
	})
	describe('utils', function () {
		it("should return checkPastPeriod as set on constructor", async () => {
			const { slaRegistry } = fixture;
			expect(await slaRegistry.checkPastPeriod()).to.be.false;
		})
		it("should return stake registry contract address", async () => {
			const { slaRegistry, stakeRegistry } = fixture;
			expect(await slaRegistry.stakeRegistry()).to.be.equal(stakeRegistry.address);
		})
		it("should return slo registry contract address", async () => {
			const { slaRegistry, sloRegistry } = fixture;
			expect(await slaRegistry.sloRegistry()).to.be.equal(sloRegistry.address);
		})
		it("should register sla when create sla", async () => {
			const { slaRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			expect(await slaRegistry.isRegisteredSLA(slaAddress)).to.be.true;
			expect(await slaRegistry.isRegisteredSLA(owner.address)).to.be.false;
		})
		it("should able to return all slas in array", async () => {
			const { slaRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slas = await slaRegistry.allSLAs();

			expect(slas.length).to.be.equal(1);
		})
		it("should return all slas created by user", async () => {
			const { slaRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const slas = await slaRegistry.userSLAs(owner.address);

			expect(slas.length).to.be.equal(1);
			expect(slas[0]).to.be.equal(slaAddress);
		})
	})
})