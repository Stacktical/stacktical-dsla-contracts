import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, utils } from "ethers";
import { ethers } from "hardhat";
import { CONTRACT_NAMES } from "../../constants";
import { MockStringUtils } from "../../typechain";

describe(CONTRACT_NAMES.StringUtils, () => {
	let user1: SignerWithAddress;
	let stringUtils: MockStringUtils;

	before(async () => {
		[user1] = await ethers.getSigners();
		const MockStringUtils = await ethers.getContractFactory("MockStringUtils");
		stringUtils = <MockStringUtils>await MockStringUtils.deploy();
		await stringUtils.deployed();
	})
	describe("stringFloatToUnit", () => {
		it("should return unit from bytes that has less than 18 precision", async () => {
			const value = 3.14159265359
			const uint = await stringUtils.stringFloatToUnit(utils.formatBytes32String(value.toString()));
			expect(utils.formatUnits(uint, 18)).to.be.equal(value.toString());
		})
		it("should cut decimals if it has 18+ decimals", async () => {
			const value = 3.1415926535897932384626 // 22 decimals
			const uint = await stringUtils.stringFloatToUnit(utils.formatBytes32String(value.toString()));
			expect(utils.formatUnits(uint, 18)).to.be.equal('3.141592653589793');
		})
	})
	describe("addressToString", () => {
		it("should convert address to string", async () => {
			expect(
				await stringUtils.addressToString(user1.address)
			).to.be.equal(user1.address.toLowerCase());
		})
	})
	describe("bytes32ToStr", () => {
		it("should convert bytes to string", async () => {
			const value="DSLA Core";
			expect(
				await stringUtils.bytes32ToStr(utils.formatBytes32String(value))
			).to.be.equal(value);
		})
	})
	describe("bytesToUint", () => {
		it("should convert bytes to string", async () => {
			const value="123";
			expect(
				await stringUtils.bytesToUint(utils.formatBytes32String(value))
			).to.be.equal(BigNumber.from(value));
		})
	})
	describe("uintToStr", () => {
		it("should convert bytes to string", async () => {
			const value=1234;
			expect(
				await stringUtils.uintToStr(value)
			).to.be.equal(value.toString());
			expect(
				await stringUtils.uintToStr(0)
			).to.be.equal("0");
		})
	})
})