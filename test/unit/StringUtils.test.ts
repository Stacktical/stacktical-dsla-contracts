// const hre = require('hardhat');
// const { ethers, waffle, deployments, getNamedAccounts } = hre;
// import { expect } from '../chai-setup';
// import { CONTRACT_NAMES } from "../../constants";
// import { StringUtils } from "../../typechain";
// import { BigNumber, ethers as Ethers } from 'ethers';
// import { DeployOptionsBase } from 'hardhat-deploy/dist/types';

// interface Fixture {
// 	stringUtils: StringUtils
// }

// const setup = deployments.createFixture(async () => {
// 	const { deployer } = await getNamedAccounts();
// 	const { deploy, get } = deployments;
// 	const baseOptions: DeployOptionsBase = {
// 		from: deployer,
// 		log: true,
// 	};
// 	await deploy(CONTRACT_NAMES.StringUtils, baseOptions);
// 	const stringUtils: StringUtils = await ethers.getContract(CONTRACT_NAMES.StringUtils);
// 	return {
// 		stringUtils
// 	};
// })

// describe(CONTRACT_NAMES.StringUtils, () => {
// 	let fixture: Fixture;

// 	beforeEach(async function () {
// 		fixture = await setup();
// 	});

// 	it("addressToString", async () => {
// 		const { stringUtils } = fixture;
// 		const { deployer, notDeployer } = await getNamedAccounts();
// 		expect(await stringUtils.addressToString(Ethers.constants.AddressZero))
// 			.to.be.eq(Ethers.constants.AddressZero);
// 		expect(await stringUtils.addressToString(deployer))
// 			.to.be.eq(deployer.toLowerCase());
// 		expect(await stringUtils.addressToString(notDeployer))
// 			.to.be.eq(notDeployer.toLowerCase());
// 	})
// 	it("bytes32ToStr", async () => {
// 		const { stringUtils } = fixture;
// 		expect(await stringUtils.bytes32ToStr('0x7465737400000000000000000000000000000000000000000000000000000000'))
// 			.to.be.eq('test');
// 		expect(await stringUtils.bytes32ToStr('0x7465737474657374746573747465737474657374746573747465737474657374'))
// 			.to.be.eq('testtesttesttesttesttesttesttest');
// 	})
// 	it("bytesToUint", async () => {
// 		const { stringUtils } = fixture;
// 		expect(await stringUtils.bytesToUint([49])).to.be.eq(BigNumber.from(1));
// 		expect(await stringUtils.bytesToUint([49, 49])).to.be.eq(BigNumber.from(11));
// 		expect(await stringUtils.bytesToUint([49, 49, 49])).to.be.eq(BigNumber.from(111));
// 	})
// 	it("uintToStr", async () => {
// 		const { stringUtils } = fixture;
// 		expect(await stringUtils.uintToStr(BigNumber.from(1))).to.be.eq('1');
// 		expect(await stringUtils.uintToStr(BigNumber.from(11))).to.be.eq('11');
// 		expect(await stringUtils.uintToStr(BigNumber.from(111))).to.be.eq('111');
// 		expect(await stringUtils.uintToStr(BigNumber.from(1111))).to.be.eq('1111');
// 		expect(await stringUtils.uintToStr(BigNumber.from(11111))).to.be.eq('11111');
// 	})
// })