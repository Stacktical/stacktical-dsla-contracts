const DAI = artifacts.require("DAI");
const SLA = artifacts.require("SLA");
const { toWei } = web3.utils;

const SLAAdress = "0x8265dd2885e3A9b5F49c2631BD24AeF7C9824D1f";
const initialTokenSupply = "100";

module.exports = async (callback) => {
  try {
    const [owner] = await web3.eth.getAccounts();
    console.log("Owner address is: " + owner);
    const dai = await DAI.deployed();
    const stakeAmount = toWei(String(initialTokenSupply / 10));
    await dai.approve(SLAAdress, stakeAmount);
    const sla = await SLA.at(SLAAdress);
    await sla.stakeTokens(stakeAmount, dai.address, 5);
    const daiStakingIndex = await sla.callback(null);
  } catch (error) {
    callback(error);
  }
};
