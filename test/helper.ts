import { ethers } from "hardhat";

export const parseUnits = (value: string) => ethers.utils.parseUnits(value.toString());

export async function advanceBlock() {
	return ethers.provider.send('evm_mine', [])
}

export const latestBlockNumber = async () => {
	return await ethers.provider.getBlockNumber();
};

export const evm_increaseTime = async (seconds: number) => {
	await ethers.provider.send("evm_increaseTime", [seconds]);
	await advanceBlock();
};

export const evm_mine_blocks = async (n: number) => {
	for (let i = 0; i < n; i++) {
		await advanceBlock();
	}
};

export const currentTimestamp = Math.floor(Date.now() / 1000);
export const ONE_DAY = 60 * 60 * 24;