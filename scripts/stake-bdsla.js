const bDSLAToken = artifacts.require('bDSLAToken');
const SLA = artifacts.require('SLA');
const { toWei, fromWei } = web3.utils;

const SLAAdress = '0x183b9e1fC7E99cCFC843959A91D1018B96378158';

module.exports = async (callback) => {
  try {
    const sla = await SLA.at(SLAAdress);

    const [owner, notOwner] = await web3.eth.getAccounts();
    const account = process.env.NOT_OWNER ? notOwner : owner;

    console.log(`Owner address is: ${account}`);

    const bdslaToken = await bDSLAToken.deployed();
    console.log(`bDSLA address is: ${bdslaToken.address}`);
    const bdslaTokenAlreadyAdded = await sla.allowedTokensMapping.call(bdslaToken.address);
    console.log(`bDSLA added status is: ${bdslaTokenAlreadyAdded}`);
    if (!bdslaTokenAlreadyAdded) {
      await sla.addAllowedTokens(bdslaToken.address);
    }

    const stakeAmount = toWei(String('10000'));
    const balance = await bdslaToken.balanceOf(owner);
    console.log(`Owner balance is: ${balance}`);
    await bdslaToken.approve(SLAAdress, stakeAmount, { from: account });
    await sla.stakeTokens(stakeAmount, bdslaToken.address, 4, { from: account });
    const bdslaTokenStakingIndex = await sla.userStakedTokensIndex.call(
      account,
      bdslaToken.address,
    );

    console.log(`bDSLA Staking index: ${bdslaTokenStakingIndex}`);
    const bdslaTokenStake = await sla.userStakes.call(account, bdslaTokenStakingIndex);
    console.log(`bDSLA stake: ${fromWei(bdslaTokenStake.stake.toString())}`);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
