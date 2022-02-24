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
	SLA,
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
	dslaToken: ERC20PresetMinterPauser;
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
	const { deployer, notDeployer } = await getNamedAccounts();
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
	const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
		CONTRACT_NAMES.DSLA
	);
	await dslaToken.mint(deployer, mintAmount);
	await dslaToken.mint(notDeployer, mintAmount);
	return {
		sloRegistry,
		slaRegistry,
		stakeRegistry,
		periodRegistry,
		dslaToken,
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
	mockMessenger.mock.requestSLI.returns();
	mockMessenger.mock.owner.returns(deployer);
	mockMessenger.mock.setSLARegistry.returns();

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

describe(CONTRACT_NAMES.StakeRegistry, function () {
	let fixture: Fixture;
	let deployer: string, notDeployer: string;
	beforeEach(async function () {
		deployer = (await getNamedAccounts()).deployer;
		notDeployer = (await getNamedAccounts()).notDeployer;
		fixture = await setup();
	});
	it("should register dsla token at constructor", async () => {
		const { stakeRegistry } = fixture;
		const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
			CONTRACT_NAMES.DSLA
		);
		expect(await stakeRegistry.DSLATokenAddress()).to.be.equal(dslaToken.address);
		expect(await stakeRegistry.allowedTokens(0)).to.be.equal(dslaToken.address);
	})
	it("should be able to set slaRegistry address once at first", async () => {
		const { stakeRegistry, slaRegistry } = fixture;
		const slaRegistryOnStake = await stakeRegistry.slaRegistry();
		expect(slaRegistryOnStake).to.be.eq(slaRegistry.address);
		await expect(stakeRegistry.setSLARegistry()).to.be.revertedWith(
			'SLARegistry address has already been set'
		);
	})
	it("should allow only owner to add allowed tokens", async () => {
		const { stakeRegistry, dslaToken } = fixture;
		const signer = await ethers.getSigner(notDeployer);

		await expect(stakeRegistry.addAllowedTokens(dslaToken.address))
			.to.be.revertedWith('token already added');
		await stakeRegistry.addAllowedTokens(deployer);
		expect(await stakeRegistry.allowedTokens(1)).to.be.eq(deployer);

		await expect(stakeRegistry.connect(signer).addAllowedTokens(dslaToken.address))
			.to.be.revertedWith('Ownable: caller is not the owner');
	})
	it("should able to check if the token is added to allowed tokens", async () => {
		const { stakeRegistry, dslaToken } = fixture;
		expect(await stakeRegistry.isAllowedToken(dslaToken.address)).to.be.true;
		expect(await stakeRegistry.isAllowedToken(deployer)).to.be.false;
	})
	it("should allow registration of owners of staking only for registered slas", async () => {
		const { stakeRegistry, slaRegistry, dslaToken } = fixture;
		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
		const sla: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress);

		await expect(stakeRegistry.registerStakedSla(deployer)).to.be.revertedWith(
			'Only for registered SLAs'
		);
		await sla.addAllowedTokens(dslaToken.address);
		await dslaToken.approve(slaAddress, mintAmount);
		await sla.stakeTokens(mintAmount, dslaToken.address, 'long');
		expect(await stakeRegistry.slaWasStakedByUser(deployer, slaAddress)).to.be.true;
		expect(await stakeRegistry.slaWasStakedByUser(deployer, deployer)).to.be.false;
	})
	it("should create dTokens when staking tokens on sla", async () => {
		const { stakeRegistry, slaRegistry, dslaToken } = fixture;
		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
		const sla: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress);

		await expect(sla.addAllowedTokens(dslaToken.address))
			.to.emit(stakeRegistry, "DTokenCreated");
	})
	it("should lock dsla when creating sla on slaRegistry", async () => {
		const { slaRegistry, stakeRegistry, dslaToken } = fixture;
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
		)).to.emit(stakeRegistry, "ValueLocked");
	})
})