const hre = require('hardhat');
const { ethers, deployments, getNamedAccounts } = hre;
import { expect } from '../chai-setup';
import { BytesLike } from 'ethers';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS, SENetworkNamesBytes32, SENetworks, PERIOD_TYPE, SLO_TYPE } from '../../constants';
import { deployMockContract } from 'ethereum-waffle';
import { toWei } from 'web3-utils';
import {
	ERC20PresetMinterPauser,
	PeriodRegistry,
	SLARegistry,
	SLA__factory,
	SLORegistry,
	StakeRegistry
} from '../../typechain';

type Fixture = {
	sloRegistry: SLORegistry;
	slaRegistry: SLARegistry;
	stakeRegistry: StakeRegistry;
	periodRegistry: PeriodRegistry;
};
interface SLAConfig {
	sloValue: number,
	sloType: SLO_TYPE,
	whitelisted: boolean,
	periodType: PERIOD_TYPE,
	initialPeriodId: number,
	finalPeriodId: number,
	extraData: BytesLike[]
}
const baseSLAConfig = {
	sloValue: 50 * 10 ** 3,
	sloType: SLO_TYPE.GreaterThan,
	whitelisted: false,
	periodType: PERIOD_TYPE.WEEKLY,
	initialPeriodId: 0,
	finalPeriodId: 10,
	extraData: [SENetworkNamesBytes32[SENetworks.ONE]],
	leverage: 10,
};
const mintAmount = '1000000';

const setup = deployments.createFixture(async () => {
	const { deployments } = hre;
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
	const periodRegistry: PeriodRegistry = await ethers.getContract(
		CONTRACT_NAMES.PeriodRegistry
	);
	return {
		sloRegistry,
		slaRegistry,
		stakeRegistry,
		periodRegistry,
	};
});

const deploySLA = async (slaConfig: SLAConfig) => {
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
	await mockMessenger.mock.lpName.returns('UPTIME.ok');
	await mockMessenger.mock.spName.returns('UPTIME.ko');
	await mockMessenger.mock.requestSLI.returns();
	await mockMessenger.mock.owner.returns(deployer);
	await mockMessenger.mock.setSLARegistry.returns();

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
		10
	)
	await tx.wait();
}

describe(CONTRACT_NAMES.SLARegistry, function () {
	let fixture: Fixture;
	let deployer: string, notDeployer: string;
	beforeEach(async function () {
		deployer = (await getNamedAccounts()).deployer;
		notDeployer = (await getNamedAccounts()).notDeployer;
		fixture = await setup();
	});
	it("should be able to create sla by anyone", async () => {
		const { slaRegistry } = fixture;
		const stakeRegistry: StakeRegistry = await ethers.getContract(
			CONTRACT_NAMES.StakeRegistry
		);
		const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
			CONTRACT_NAMES.DSLA
		);

		const { deployer, notDeployer } = await getNamedAccounts();
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
	it("should be able to request sli", async () => {
		const { slaRegistry } = fixture;
		const signer = await ethers.getSigner(deployer);
		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
		const sla = await SLA__factory.connect(slaAddress, signer);
		const nextVerifiablePeriod = await sla.nextVerifiablePeriod();
		await expect(slaRegistry.requestSLI(
			Number(nextVerifiablePeriod),
			slaAddress,
			false
		)).to.emit(slaRegistry, "SLIRequested");
	})
	it("should able to register new messenger", async () => {
		// Can't test registerMessenger function cause we use mock contracts for both IMessenger and IMessageRegistry
	})
	it("should revert returning locked value when sla is not registered", async () => {
		const { slaRegistry } = fixture;
		await expect(slaRegistry.returnLockedValue(
			deployer
		)).to.be.revertedWith("invalid SLA");
	})
	it("should revert returning locked value when it is called from not-owner address", async () => {
		const { slaRegistry } = fixture;
		const signer = await ethers.getSigner(notDeployer);

		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
		await expect(slaRegistry.connect(signer).returnLockedValue(
			slaAddress
		)).to.be.revertedWith("msg.sender not owner");
	})
	it("should revert returning locked value when sla contract is not finished yet.", async () => {
		const { slaRegistry } = fixture;

		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
		await expect(slaRegistry.returnLockedValue(
			slaAddress
		)).to.be.revertedWith("not finished contract");
	})
	it("should return locked value after sla contract has finished", async () => {
		const { slaRegistry } = fixture;
		const signer = await ethers.getSigner(deployer);

		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

		const sla = await SLA__factory.connect(slaAddress, signer);
		const lastPeriodId = await sla.finalPeriodId();
		// TODO: Complete returnLockedValue - Can't cover this function at the moment cause we use mock messenger contract
	})
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
		expect(await slaRegistry.isRegisteredSLA(deployer)).to.be.false;
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
		const slas = await slaRegistry.userSLAs(deployer);

		expect(slas.length).to.be.equal(1);
		expect(slas[0]).to.be.equal(slaAddress);
	})
})