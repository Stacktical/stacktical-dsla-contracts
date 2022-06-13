import { ethers, deployments, getNamedAccounts } from 'hardhat';
import {
	ERC20PresetMinterPauser,
	MockMessenger,
	PeriodRegistry,
	SLARegistry,
	SLORegistry,
	SLORegistry__factory,
	StakeRegistry
} from '../../typechain';
import {
	CONTRACT_NAMES,
	DEPLOYMENT_TAGS,
	SENetworkNamesBytes32,
	SENetworks,
	SLO_TYPE
} from '../../constants';
import { expect } from '../chai-setup';
import { PERIOD_TYPE } from '../../constants';
import { toWei } from 'web3-utils';
import { BigNumber, BytesLike } from 'ethers';

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
	finalPeriodId: 1,
	extraData: [SENetworkNamesBytes32[SENetworks.ONE]],
	leverage: 10,
};
const mintAmount = '1000000';

const setup = deployments.createFixture(async () => {
	await deployments.fixture(DEPLOYMENT_TAGS.SLA_REGISTRY_FIXTURE);
	const sloRegistry: SLORegistry = await ethers.getContract(
		CONTRACT_NAMES.SLORegistry
	);

	const slaRegistry: SLARegistry = await ethers.getContract(
		CONTRACT_NAMES.SLARegistry
	);
	const periodRegistry: PeriodRegistry = await ethers.getContract(
		CONTRACT_NAMES.PeriodRegistry
	);
	const stakeRegistry: StakeRegistry = await ethers.getContract(
		CONTRACT_NAMES.StakeRegistry
	);
	return {
		sloRegistry,
		slaRegistry,
		periodRegistry,
		stakeRegistry,
	};
});

type Fixture = {
	sloRegistry: SLORegistry;
	slaRegistry: SLARegistry;
	periodRegistry: PeriodRegistry;
	stakeRegistry: StakeRegistry;
};

const deploySLA = async (slaConfig: SLAConfig) => {
	const slaRegistry: SLARegistry = await ethers.getContract(
		CONTRACT_NAMES.SLARegistry
	);
	const stakeRegistry: StakeRegistry = await ethers.getContract(
		CONTRACT_NAMES.StakeRegistry
	);
	const periodRegistry: PeriodRegistry = await ethers.getContract(
		CONTRACT_NAMES.PeriodRegistry
	);
	const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
		CONTRACT_NAMES.DSLA
	);

	const { deployer, notDeployer } = await getNamedAccounts();
	await dslaToken.mint(deployer, toWei(mintAmount));
	await dslaToken.mint(notDeployer, toWei(mintAmount));
	await dslaToken.approve(stakeRegistry.address, toWei(mintAmount));

	// deploy mock messenger
	await deployments.deploy(CONTRACT_NAMES.MockMessenger, {
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
	const mockMessenger: MockMessenger = await ethers.getContract(CONTRACT_NAMES.MockMessenger);
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
		baseSLAConfig.leverage
	)
	await tx.wait();
}

const getDeviation = (sloValue: number, sliValue: number, precision: number) => {
	return Math.floor(Math.abs(sliValue - sloValue) * precision / ((sloValue + sliValue) / 2));
}

describe(CONTRACT_NAMES.SLORegistry, function () {
	let fixture: Fixture;
	let deployer: string;
	beforeEach(async function () {
		deployer = (await getNamedAccounts()).deployer;
		fixture = await setup();
	});

	it("should revert if SLARegistry is already set", async function () {
		const { sloRegistry } = fixture;
		const deployerSLO = SLORegistry__factory.connect(
			sloRegistry.address,
			await ethers.getSigner(deployer)
		)
		await expect(deployerSLO.setSLARegistry()).to.be.revertedWith(
			"SLARegistry address has already been set"
		);
	})

	it("SLO registration is only allowed for SLARegistry", async function () {
		const { sloRegistry } = fixture;
		const deployerSLO = SLORegistry__factory.connect(
			sloRegistry.address,
			await ethers.getSigner(deployer)
		)
		await expect(deployerSLO.registerSLO(0, 0, ethers.constants.AddressZero))
			.to.be.revertedWith("Should only be called using the SLARegistry contract");
	})

	it("should emit SLORegistered when creating SLA from SLARegistry", async () => {
		const { slaRegistry, sloRegistry, periodRegistry, stakeRegistry } = fixture;
		const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
			CONTRACT_NAMES.DSLA
		);

		const { deployer, notDeployer } = await getNamedAccounts();
		await dslaToken.mint(deployer, toWei(mintAmount));
		await dslaToken.mint(notDeployer, toWei(mintAmount));
		await dslaToken.approve(stakeRegistry.address, toWei(mintAmount));

		// deploy mock messenger
		await deployments.deploy(CONTRACT_NAMES.MockMessenger, {
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
		const mockMessenger: MockMessenger = await ethers.getContract(CONTRACT_NAMES.MockMessenger);
		await slaRegistry.registerMessenger(mockMessenger.address, 'dummy link');

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
		)).to.emit(sloRegistry, "SLORegistered");
	})

	describe("checks sli value against SLOValue - isRespected", () => {
		const config = {
			sloValue: baseSLAConfig.sloValue,
			sloType: baseSLAConfig.sloType,
			whitelisted: baseSLAConfig.whitelisted,
			periodType: baseSLAConfig.periodType,
			initialPeriodId: baseSLAConfig.initialPeriodId,
			finalPeriodId: baseSLAConfig.finalPeriodId,
			extraData: baseSLAConfig.extraData,
		}
		it("GreaterThan", async () => {
			await deploySLA(config);
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue, slaAddress)).to.be.false;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue + 1, slaAddress)).to.be.true;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue - 1, slaAddress)).to.be.false;
		})
		it("EqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.EqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue, slaAddress)).to.be.true;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue + 1, slaAddress)).to.be.false;
		})
		it("NotEqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.NotEqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue, slaAddress)).to.be.false;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue + 1, slaAddress)).to.be.true;
		})
		it("SmallerThan", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.SmallerThan,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue, slaAddress)).to.be.false;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue + 1, slaAddress)).to.be.false;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue - 1, slaAddress)).to.be.true;
		})
		it("SmallerOrEqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.SmallerOrEqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue, slaAddress)).to.be.true;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue + 1, slaAddress)).to.be.false;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue - 1, slaAddress)).to.be.true;
		})
		it("GreaterOrEqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.GreaterOrEqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue, slaAddress)).to.be.true;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue + 1, slaAddress)).to.be.true;
			expect(await sloRegistry.isRespected(baseSLAConfig.sloValue - 1, slaAddress)).to.be.false;
		})
	})
	describe("checks deviations - getDeviation", () => {
		const config = {
			sloValue: baseSLAConfig.sloValue,
			sloType: baseSLAConfig.sloType,
			whitelisted: baseSLAConfig.whitelisted,
			periodType: baseSLAConfig.periodType,
			initialPeriodId: baseSLAConfig.initialPeriodId,
			finalPeriodId: baseSLAConfig.finalPeriodId,
			extraData: baseSLAConfig.extraData,
		}
		const sloValue = baseSLAConfig.sloValue;
		const precision = 10000;
		it("EqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.EqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sliValue = 45 * 10 ** 3;
			const deviation = await sloRegistry.getDeviation(
				sliValue,
				slaAddress
			)
			expect(deviation).to.be.equal(BigNumber.from(1 * 2500));
		})
		it("NotEqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.NotEqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sliValue = 45 * 10 ** 3;
			const deviation = await sloRegistry.getDeviation(
				sliValue,
				slaAddress
			)
			expect(deviation).to.be.equal(BigNumber.from(1 * 2500));
		})
		it("GreaterThan", async () => {
			await deploySLA(config);
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			const sliValue = 45 * 10 ** 3;
			const deviation = await sloRegistry.getDeviation(
				sliValue,
				slaAddress
			)
			expect(deviation).to.be.equal(BigNumber.from(getDeviation(sloValue, sliValue, precision)));
			expect(await sloRegistry.getDeviation(
				sliValue / 2,
				slaAddress
			)).to.be.equal(BigNumber.from(25).mul(precision).div(100));
		})
		it("GreaterOrEqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.GreaterOrEqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			const sliValue = 45 * 10 ** 3;
			const deviation = await sloRegistry.getDeviation(
				sliValue,
				slaAddress
			)
			expect(deviation).to.be.equal(BigNumber.from(getDeviation(sloValue, sliValue, precision)));
			expect(await sloRegistry.getDeviation(
				sliValue / 2,
				slaAddress
			)).to.be.equal(BigNumber.from(25).mul(precision).div(100));
		})
		it("SmallerThan", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.SmallerThan,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			const sliValue = 45 * 10 ** 3;
			const deviation = await sloRegistry.getDeviation(
				sliValue,
				slaAddress
			)
			expect(deviation).to.be.equal(BigNumber.from(getDeviation(sloValue, sliValue, precision)));
			expect(await sloRegistry.getDeviation(
				sliValue / 2,
				slaAddress
			)).to.be.equal(BigNumber.from(25).mul(precision).div(100));
		})
		it("SmallerOrEqualTo", async () => {
			await deploySLA({
				...config,
				sloType: SLO_TYPE.SmallerOrEqualTo,
			})
			const { slaRegistry, sloRegistry } = fixture;
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];

			const sliValue = 45 * 10 ** 3;
			const deviation = await sloRegistry.getDeviation(
				sliValue,
				slaAddress
			)
			expect(deviation).to.be.equal(BigNumber.from(getDeviation(sloValue, sliValue, precision)));
			expect(await sloRegistry.getDeviation(
				sliValue / 2,
				slaAddress
			)).to.be.equal(BigNumber.from(25).mul(precision).div(100));
		})
	})
})