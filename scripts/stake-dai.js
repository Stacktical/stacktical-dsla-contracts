const DAI = artifacts.require('DAI');
const SLA = artifacts.require('SLA');
const { toWei, fromWei } = web3.utils;

const SLAAdress = '0x0bEA2c54d72a002654692100E065de9d5D22d725';

module.exports = async (callback) => {
  try {
    const sla = await SLA.at(SLAAdress);

    const [owner, notOwner] = await web3.eth.getAccounts();
    const account = process.env.NOT_OWNER ? notOwner : owner;

    console.log(`Owner address is: ${account}`);

    const dai = await DAI.deployed();
    console.log(`DAI address is: ${dai.address}`);

    await sla.addAllowedTokens(dai.address);

    const stakeAmount = toWei(String('100'));
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
