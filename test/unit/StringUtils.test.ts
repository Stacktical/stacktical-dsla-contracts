import { expect } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";
import { CONTRACT_NAMES } from "../../constants";
import { MockStringUtils } from "../../typechain";

describe(CONTRACT_NAMES.StringUtils, () => {
	let stringUtils: MockStringUtils;
	before(async () => {
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
})