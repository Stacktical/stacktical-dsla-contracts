const SLA = artifacts.require('SLA');
const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');
const { fromWei } = web3.utils;
const slaAddress = '0x43954Db71503B089396BdD81fCC7FE8F9f1b42d0';

module.exports = async (callback) => {
  try {
    const [owner, notOwner] = await web3.eth.getAccounts();
    console.log(`owner address is: ${owner}`);
    console.log(`notOwner address is: ${notOwner}`);
    const bdslaToken = await bDSLA.deployed();
    const daiToken = await DAI.deployed();
    const usdcToken = await USDC.deployed();
    const sla = await SLA.at(slaAddress);
    // SLA balances
    const slabDSLABalance = await bdslaToken.balanceOf(slaAddress);
    const sladaiBalance = await daiToken.balanceOf(slaAddress);
    const slausdcBalance = await usdcToken.balanceOf(slaAddress);
    console.log(`SLA bDSLA balance is: ${fromWei(slabDSLABalance)}`);
    console.log(`SLA DAI balance is: ${fromWei(sladaiBalance)}`);
    console.log(`SLA USDC balance is: ${fromWei(slausdcBalance)}`);

    // Owner stakes
    const ownerbdslaStake = await sla.providerPool(bdslaToken.address);
    const ownerdaiStake = await sla.providerPool(daiToken.address);
    const ownerusdcStake = await sla.providerPool(usdcToken.address);
    console.log(`Owner bDSLA stake is: ${fromWei(ownerbdslaStake)}`);
    console.log(`Owner DAI stake is: ${fromWei(ownerdaiStake)}`);
    console.log(`Owner USDC stake is: ${fromWei(ownerusdcStake)}`);

    // notOwner stakes
    const notOwnerbdslaStake = await sla.usersPool(bdslaToken.address);
    const notOwnerdaiStake = await sla.usersPool(daiToken.address);
    const notOwnerusdcStake = await sla.usersPool(usdcToken.address);
    console.log(`notOwner bDSLA stake is: ${fromWei(notOwnerbdslaStake)}`);
    console.log(`notOwner DAI stake is: ${fromWei(notOwnerdaiStake)}`);
    console.log(`notOwner USDC stake is: ${fromWei(notOwnerusdcStake)}`);

    const slaBlockCreation = await sla.creationBlockNumber();
    const providerRewards = await sla.getPastEvents('ProviderRewardGenerated', { fromBlock: slaBlockCreation });
    const sliCreateds = await sla.getPastEvents('SLICreated', { fromBlock: slaBlockCreation });
    sliCreateds.forEach((sli, index) => {
      console.log(`sli ${index}`);
      console.log(sli.returnValues);
    });
    providerRewards.forEach((reward, index) => {
      console.log(`providerReward ${index}`);
      console.log(reward.returnValues);
    });

    callback(null);
  } catch (error) {
    callback(error);
  }
};
