const DAI = artifacts.require("DAI");
const SLA = artifacts.require("SLA");
const { toWei, fromWei } = web3.utils;

const SLAAdress = "0x874cAeB2a47366FB86eB5EAbcCFC33b3F05b4C5e";

module.exports = async (callback) => {
  try {
    const sla = await SLA.at(SLAAdress);

    const [owner] = await web3.eth.getAccounts();
    console.log("Owner address is: " + owner);

    const dai = await DAI.deployed();
    console.log("DAI address is: " + dai.address);
    const stakeAmount = toWei(String("100"));
    await dai.approve(SLAAdress, stakeAmount);
    await sla.stakeTokens(stakeAmount, dai.address, 4);
    const daiStakingIndex = await sla.userStakedTokensIndex.call(
      owner,
      dai.address
    );
    console.log("DAI Staking index: " + daiStakingIndex);
    const daiStake = await sla.userStakes.call(owner, daiStakingIndex);
    console.log("DAI stake: " + fromWei(daiStake.stake.toString()));
    callback(null);
  } catch (error) {
    callback(error);
  }
};
