import { ethers, deployments, getNamedAccounts } from 'hardhat';
import { expect } from '../chai-setup';
import { BigNumber, BytesLike, ethers as Ethers } from 'ethers';
import { CONTRACT_NAMES, DEPLOYMENT_TAGS, SENetworkNamesBytes32, SENetworks, PERIOD_TYPE, SLO_TYPE } from '../../constants';
import { toWei } from 'web3-utils';
import {
	DToken,
	ERC20PresetMinterPauser,
	MockMessenger,
	PeriodRegistry,
	SLA,
	SLARegistry,
	SLA__factory,
	SLORegistry,
	StakeRegistry
} from '../../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { evm_increaseTime } from '../helper';
const moment = require('moment');

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
enum POSITION {
	OK,
	KO,
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
const periodStart = moment()
	.utc(0)
	.startOf('month')
	.add(10, 'month')
	.startOf('month')
	.unix();

const setup = deployments.createFixture(async () => {
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
	await dslaToken.mint(deployer, toWei(mintAmount));
	await dslaToken.mint(notDeployer, mintAmount);
	return {
		sloRegistry,
		slaRegistry,
		stakeRegistry,
		periodRegistry,
		dslaToken,
	};
});

const deployMessenger = async (
	deployer: string,
	periodRegistry: string,
	stakeRegistry: string
) => {
	// deploy mock messenger
	const tx = await deployments.deploy(CONTRACT_NAMES.MockMessenger, {
		from: deployer,
		log: true,
		args: [
			ethers.constants.AddressZero,
			ethers.constants.AddressZero,
			1,
			periodRegistry,
			stakeRegistry,
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

	const { deployer } = await getNamedAccounts();
	await dslaToken.mint(deployer, toWei(mintAmount));
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
	const mockMessenger = await deployMessenger(deployer, periodRegistry.address, stakeRegistry.address)
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
		10
	)
	await tx.wait();
}

describe(CONTRACT_NAMES.StakeRegistry, function () {
	let fixture: Fixture;
	let owner: SignerWithAddress;
	let user: SignerWithAddress;
	before(async () => {
		[owner, user] = await ethers.getSigners();
	})
	beforeEach(async function () {
		fixture = await setup();
	});
	describe('constructor', function () {
		it("should register dsla token at constructor", async () => {
			const { stakeRegistry } = fixture;
			const dslaToken: ERC20PresetMinterPauser = await ethers.getContract(
				CONTRACT_NAMES.DSLA
			);
			expect(await stakeRegistry.DSLATokenAddress()).to.be.equal(dslaToken.address);
			expect(await stakeRegistry.allowedTokens(0)).to.be.equal(dslaToken.address);
		})
		it("should revert constructor if DSLA token address is invalid", async () => {
			const { deploy } = deployments
			await expect(deploy(CONTRACT_NAMES.StakeRegistry, {
				from: owner.address,
				log: true,
				args: [Ethers.constants.AddressZero],
			})).to.be.revertedWith('invalid DSLA token address');
		})
		it("should be able to set slaRegistry address once at first", async () => {
			const { stakeRegistry, slaRegistry } = fixture;
			const slaRegistryOnStake = await stakeRegistry.slaRegistry();
			expect(slaRegistryOnStake).to.be.eq(slaRegistry.address);
			await expect(stakeRegistry.setSLARegistry()).to.be.revertedWith(
				'SLARegistry address has already been set'
			);
		})
	})
	describe('token allowance', function () {
		it("should allow only owner to add allowed tokens", async () => {
			const { stakeRegistry, dslaToken } = fixture;

			await expect(stakeRegistry.addAllowedTokens(dslaToken.address))
				.to.be.revertedWith('This token has been allowed already.');
			await stakeRegistry.addAllowedTokens(owner.address);
			expect(await stakeRegistry.allowedTokens(1)).to.be.eq(owner.address);

			await expect(stakeRegistry.connect(user).addAllowedTokens(dslaToken.address))
				.to.be.revertedWith('Ownable: caller is not the owner');
		})
		it("should able to check if the token is added to allowed tokens", async () => {
			const { stakeRegistry, dslaToken } = fixture;
			expect(await stakeRegistry.isAllowedToken(dslaToken.address)).to.be.true;
			expect(await stakeRegistry.isAllowedToken(owner.address)).to.be.false;
		})
	})
	it("should allow registration of owners of staking only for registered slas", async () => {
		const { stakeRegistry, slaRegistry, dslaToken } = fixture;
		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
		const sla: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress);

		await expect(stakeRegistry.registerStakedSla(owner.address)).to.be.revertedWith(
			'Only for registered SLAs'
		);
		await sla.addAllowedTokens(dslaToken.address);
		await dslaToken.approve(slaAddress, mintAmount);
		await sla.stakeTokens(mintAmount, dslaToken.address, POSITION.OK);
		expect(await stakeRegistry.slaWasStakedByUser(owner.address, slaAddress)).to.be.true;
		expect(await stakeRegistry.slaWasStakedByUser(owner.address, owner.address)).to.be.false;
	})
	describe('creating dToken', function () {
		it("should allow creating dTokens only for registered SLA", async () => {
			const { stakeRegistry } = fixture;
			await expect(
				stakeRegistry.connect(owner).createDToken('Test', 'TEST', 18)
			).to.be.revertedWith('Only for registered SLAs')
		})
		it("should create dTokens when staking tokens on sla", async () => {
			const { stakeRegistry, slaRegistry, dslaToken } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress);

			await expect(sla.addAllowedTokens(dslaToken.address))
				.to.emit(stakeRegistry, "DTokenCreated");
		})
	})
	it("should create dTokens with same decimals as registered token", async () => {
		const { slaRegistry, dslaToken } = fixture;
		await deploySLA(baseSLAConfig);
		const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
		const sla: SLA = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress);
		await sla.addAllowedTokens(dslaToken.address);

		const duTokenAddr = await sla.duTokenRegistry(dslaToken.address);
		const duToken: DToken = await ethers.getContractAt(CONTRACT_NAMES.dToken, duTokenAddr);
		const dslaDecimal = await dslaToken.decimals();
		expect(await duToken.decimals()).to.be.eq(dslaDecimal);
	})
	it("should lock dsla when creating sla on slaRegistry", async () => {
		const { slaRegistry, stakeRegistry, dslaToken, periodRegistry } = fixture;
		await dslaToken.mint(owner.address, toWei(mintAmount));
		await dslaToken.mint(user.address, toWei(mintAmount));
		await dslaToken.approve(stakeRegistry.address, toWei(mintAmount));

		// deploy mock messenger
		const mockMessenger = await deployMessenger(owner.address, periodRegistry.address, stakeRegistry.address);
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
		)).to.emit(stakeRegistry, "ValueLocked");
	})
	describe('Rewards Distribution', function () {
		it("should distribute verification rewards when requesting sli on slaRegistry", async () => {
			const { slaRegistry, stakeRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress, owner)
			const nextVerifiablePeriod = await sla.nextVerifiablePeriod();
			await evm_increaseTime(periodStart + 1000)
			await expect(slaRegistry.requestSLI(
				Number(nextVerifiablePeriod),
				slaAddress,
				false
			)).to.emit(stakeRegistry, "VerificationRewardDistributed");
		})
		it('should allow distribution only for SLARegistry', async () => {
			const { slaRegistry, stakeRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress, owner)
			const nextVerifiablePeriod = await sla.nextVerifiablePeriod();
			await expect(stakeRegistry.connect(owner).distributeVerificationRewards(
				slaAddress,
				owner.address,
				nextVerifiablePeriod,
			)).to.be.revertedWith('Can only be called by SLARegistry')
		})
		it("should revert when verfication rewards are already distrubuted", async () => {
			const { slaRegistry, stakeRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress, owner)
			const nextVerifiablePeriod = await sla.nextVerifiablePeriod();
			await evm_increaseTime(periodStart + 1000)
			await expect(slaRegistry.requestSLI(
				Number(nextVerifiablePeriod),
				slaAddress,
				false
			)).to.emit(stakeRegistry, "VerificationRewardDistributed");
			await expect(slaRegistry.requestSLI(
				Number(nextVerifiablePeriod),
				slaAddress,
				false
			)).to.be.revertedWith("Period rewards already distributed");
		})
		it("should recieve verfication rewards", async () => {
			const { slaRegistry, dslaToken } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress, owner)
			const nextVerifiablePeriod = await sla.nextVerifiablePeriod();
			const dslaBalance = await dslaToken.balanceOf(owner.address);
			await evm_increaseTime(periodStart + 1000)
			await slaRegistry.requestSLI(
				Number(nextVerifiablePeriod),
				slaAddress,
				false
			)
			// receive userReward + platformReward + messengerRewards since all txs made from deployer
			expect(await dslaToken.balanceOf(owner.address))
				.to.be.eq(BigNumber.from(10).pow(18).mul(750).add(dslaBalance));
		})
		it("should verify period when distributing rewards", async () => {
			const { slaRegistry, stakeRegistry } = fixture;
			await deploySLA(baseSLAConfig);
			const slaAddress = (await slaRegistry.allSLAs()).slice(-1)[0];
			const sla = await ethers.getContractAt(CONTRACT_NAMES.SLA, slaAddress, owner)
			const nextVerifiablePeriod = await sla.nextVerifiablePeriod();
			await evm_increaseTime(periodStart + 1000)
			await slaRegistry.requestSLI(
				Number(nextVerifiablePeriod),
				slaAddress,
				false
			)
			expect(await stakeRegistry.periodIsVerified(slaAddress, nextVerifiablePeriod))
				.to.be.true;
		})
		it("should burn DSLA when distributing rewards", async () => {
			// TODO: cover later
		});
	})
	describe('Return locked value', () => {
		it('should allow returnLockedValue only for SLARegistry', async () => {
			const { slaRegistry, stakeRegistry } = fixture;
			await expect(
				stakeRegistry.connect(owner).returnLockedValue(Ethers.constants.AddressZero)
			).to.be.revertedWith('Can only be called by SLARegistry')
		})
	})
	describe('Utils', function () {
		it("should allow only owner to set staking parameters", async () => {
			const { stakeRegistry } = fixture;
			await expect(stakeRegistry.setStakingParameters(
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				true
			)).to.emit(stakeRegistry, 'StakingParametersModified');
		})

		it("dslaDepositByPeriod = dslaPlatformReward + dslaMessengerReward + dslaUserReward + dslaBurnedByVerification", async () => {
			const { stakeRegistry } = fixture;
			await expect(stakeRegistry.setStakingParameters(
				0, // burn rate
				100, // dslaDepositByPeriod
				15, // dslaPlatformReward
				10, // dslaMessengerReward
				5, // userReward
				10, // dslaBurnedByVerification
				Ethers.constants.Zero,
				Ethers.constants.Zero,
				true
			)).to.be.revertedWith('Staking parameters should match on summation');
		})
	})
})