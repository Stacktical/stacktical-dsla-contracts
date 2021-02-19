const bDSLA = artifacts.require('bDSLA');
const SLA = artifacts.require('SLA');
const { toWei, fromWei } = web3.utils;

const SLAAdress = '0x183b9e1fC7E99cCFC843959A91D1018B96378158';

module.exports = async (callback) => {
  try {
    const sla = await SLA.at(SLAAdress);

    const [owner, notOwner] = await web3.eth.getAccounts();
    const account = process.env.NOT_OWNER ? notOwner : owner;

    console.log(`Owner address is: ${account}`);

    const dslaToken = await bDSLA.deployed();
    console.log(`bDSLA address is: ${dslaToken.address}`);
    const dslaTokenAlreadyAdded = await sla.allowedTokensMapping.call(dslaToken.address);
    console.log(`bDSLA added status is: ${dslaTokenAlreadyAdded}`);
    if (!dslaTokenAlreadyAdded) {
      await sla.addAllowedTokens(dslaToken.address);
    }

    const stakeAmount = toWei(String('10000'));
    const balance = await dslaToken.balanceOf(owner);
    console.log(`Owner balance is: ${balance}`);
    await dslaToken.approve(SLAAdress, stakeAmount, { from: account });
    await sla.stakeTokens(stakeAmount, dslaToken.address, 4, { from: account });
    const dslaTokenStakingIndex = await sla.userStakedTokensIndex.call(
      account,
      dslaToken.address,
    );

    console.log(`bDSLA Staking index: ${dslaTokenStakingIndex}`);
    const dslaTokenStake = await sla.userStakes.call(account, dslaTokenStakingIndex);
    console.log(`bDSLA stake: ${fromWei(dslaTokenStake.stake.toString())}`);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
