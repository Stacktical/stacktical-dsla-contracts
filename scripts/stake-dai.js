const DAI = artifacts.require('DAI');
const SLA = artifacts.require('SLA');
const { toWei, fromWei } = web3.utils;

const SLAAdress = '0x439aEa5362e99C77c1C345ED8AA08E0b09D10F05';

module.exports = async (callback) => {
  try {
    const sla = await SLA.at(SLAAdress);

    const [owner, notOwner] = await web3.eth.getAccounts();
    const account = process.env.NOT_OWNER ? notOwner : owner;

    console.log(`Owner address is: ${account}`);

    const dai = await DAI.deployed();
    console.log(`DAI address is: ${dai.address}`);
    const daiAlreadyAdded = await sla.allowedTokensMapping.call(dai.address);
    console.log(`DAI added status is: ${daiAlreadyAdded}`);
    if (!daiAlreadyAdded) {
      await sla.addAllowedTokens(dai.address);
    }

    const stakeAmount = toWei(String('10000'));
    const balance = await dai.balanceOf(owner);
    console.log(`Owner balance is: ${balance}`);
    await dai.approve(SLAAdress, stakeAmount, { from: account });
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
