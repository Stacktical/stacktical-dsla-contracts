const USDC = artifacts.require('USDC');
const SLA = artifacts.require('SLA');
const { toWei, fromWei } = web3.utils;

const SLAAdress = '0x183b9e1fC7E99cCFC843959A91D1018B96378158';

module.exports = async (callback) => {
  try {
    const sla = await SLA.at(SLAAdress);

    const [owner, notOwner] = await web3.eth.getAccounts();
    const account = process.env.NOT_OWNER ? notOwner : owner;

    console.log(`Owner address is: ${account}`);

    const usdcToken = await USDC.deployed();
    console.log(`USDC address is: ${usdcToken.address}`);
    const usdcTokenAlreadyAdded = await sla.allowedTokensMapping.call(usdcToken.address);
    console.log(`USDC added status is: ${usdcTokenAlreadyAdded}`);
    if (!usdcTokenAlreadyAdded) {
      await sla.addAllowedTokens(usdcToken.address);
    }

    const stakeAmount = toWei(String('10000'));
    const balance = await usdcToken.balanceOf(owner);
    console.log(`Owner balance is: ${balance}`);
    await usdcToken.approve(SLAAdress, stakeAmount, { from: account });
    await sla.stakeTokens(stakeAmount, usdcToken.address, 4, { from: account });
    const usdcTokenStakingIndex = await sla.userStakedTokensIndex.call(
      account,
      usdcToken.address,
    );

    console.log(`USDC Staking index: ${usdcTokenStakingIndex}`);
    const usdcTokenStake = await sla.userStakes.call(account, usdcTokenStakingIndex);
    console.log(`USDC stake: ${fromWei(usdcTokenStake.stake.toString())}`);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
