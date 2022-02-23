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
		const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
			CONTRACT_NAMES.DSLA
		);
		const { deploy } = deployments;
		await deploy(CONTRACT_NAMES.StakeRegistry, {
			from: deployer,
			args: [dslaToken.address]
		});
		const stakeRegistry = await ethers.getContract(CONTRACT_NAMES.StakeRegistry);
		expect(await stakeRegistry.DSLATokenAddress()).to.be.equal(dslaToken.address);
		expect((await stakeRegistry.allowedTokens())[0]).to.be.equal(dslaToken.address);
	})
})