const DAI = artifacts.require('DAI');
const SLA = artifacts.require('SLA');
const { toWei, fromWei } = web3.utils;

const SLAAddress = '0x3caAf58FEf79B0F61D858bD2F13904Ea5776c907';

module.exports = async (callback) => {
  try {
    const sla = await SLA.at(SLAAddress);
    const [owner, notOwner] = await web3.eth.getAccounts();
    const account = process.env.NOT_OWNER ? notOwner : owner;

    console.log(`Owner address is: ${account}`);

    const networkType = await web3.eth.net.getNetworkType();
    const dai = networkType === 'kovan'
      ? await DAI.at('0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa')
      : await DAI.deployed();

    console.log(`DAI address is: ${dai.address}`);
    const daiAlreadyAdded = await sla.allowedTokensMapping.call(dai.address);
    console.log(`DAI added status is: ${daiAlreadyAdded}`);
    if (!daiAlreadyAdded) {
      await sla.addAllowedTokens(dai.address);
    }

    const stakeAmount = toWei(String('10'));
    const balance = await dai.balanceOf(owner);
    console.log(`Owner balance is: ${balance}`);
    await dai.approve(SLAAddress, stakeAmount, { from: account });
    await sla.stakeTokens(stakeAmount, dai.address, 4, { from: account });
    const daiStakingIndex = await sla.userStakedTokensIndex.call(
      account,
      dai.address,
    );
    console.log(`DAI Staking index: ${daiStakingIndex}`);
    const daiStake = await sla.userStakes.call(account, daiStakingIndex);
    console.log(`DAI stake: ${fromWei(daiStake.stake.toString())}`);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
