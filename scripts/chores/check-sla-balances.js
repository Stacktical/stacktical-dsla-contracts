const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');
const IERC20 = artifacts.require('IERC20');
const { fromWei } = web3.utils;

module.exports = async (callback) => {
  try {
    const [owner, notOwner] = await web3.eth.getAccounts();
    console.log(`owner address is: ${owner}`);
    console.log(`notOwner address is: ${notOwner}`);
    const bdslaToken = await bDSLA.deployed();
    // const daiToken = await DAI.deployed();
    // const usdcToken = await USDC.deployed();

    // Get last deployed SLA
    const slaRegistry = await SLARegistry.deployed();
    const slaAddresses = await slaRegistry.allSLAs.call();
    const [slaAddress] = slaAddresses.slice(-1);
    const sla = await SLA.at(slaAddress);
    console.log(`sla address is: ${slaAddress}`);

    // SLA balances
    const slabDSLABalance = await bdslaToken.balanceOf(slaAddress);
    // const sladaiBalance = await daiToken.balanceOf(slaAddress);
    // const slausdcBalance = await usdcToken.balanceOf(slaAddress);
    console.log(`SLA bDSLA balance is: ${fromWei(slabDSLABalance)}`);
    // console.log(`SLA DAI balance is: ${fromWei(sladaiBalance)}`);
    // console.log(`SLA USDC balance is: ${fromWei(slausdcBalance)}`);

    // Owner stakes
    const ownerbdslaStake = await sla.providerPool(bdslaToken.address);
    // const ownerdaiStake = await sla.providerPool(daiToken.address);
    // const ownerusdcStake = await sla.providerPool(usdcToken.address);
    console.log(`Owner bDSLA stake is: ${fromWei(ownerbdslaStake)}`);
    // console.log(`Owner DAI stake is: ${fromWei(ownerdaiStake)}`);
    // console.log(`Owner USDC stake is: ${fromWei(ownerusdcStake)}`);

    // notOwner stakes
    const notOwnerbdslaStake = await sla.usersPool(bdslaToken.address);
    // const notOwnerdaiStake = await sla.usersPool(daiToken.address);
    // const notOwnerusdcStake = await sla.usersPool(usdcToken.address);
    console.log(`notOwner bDSLA stake is: ${fromWei(notOwnerbdslaStake)}`);
    // console.log(`notOwner DAI stake is: ${fromWei(notOwnerdaiStake)}`);
    // console.log(`notOwner USDC stake is: ${fromWei(notOwnerusdcStake)}`);

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

    // DP tokens addresses
    const bdslaDPTokenAddress = await sla.dpTokenRegistry(bdslaToken.address);
    // const daiDPTokenAddress = await sla.dpTokenRegistry(daiToken.address);
    // const usdcDPTokenAddress = await sla.dpTokenRegistry(usdcToken.address);
    console.log(`dpDSLA token address is: ${bdslaDPTokenAddress}`);
    // console.log(`dpDAI token address is: ${daiDPTokenAddress}`);
    // console.log(`dpUSDC token address is: ${usdcDPTokenAddress}`);

    // Owner dp token balances
    const bdslaDPToken = await IERC20.at(bdslaDPTokenAddress);
    // const daiDPToken = await IERC20.at(daiDPTokenAddress);
    // const usdcDPToken = await IERC20.at(usdcDPTokenAddress);
    const ownerDSLAdpTokenBalance = await bdslaDPToken.balanceOf(owner);
    // const ownerDAIdpTokenBalance = await daiDPToken.balanceOf(owner);
    // const ownerUSDCdpTokenBalance = await usdcDPToken.balanceOf(owner);
    console.log(`Owner dpDSLA token balance is: ${fromWei(ownerDSLAdpTokenBalance)}`);
    // console.log(`Owner dpDAI token balance is: ${fromWei(ownerDAIdpTokenBalance)}`);
    // console.log(`Owner dpUSDC token balance is: ${fromWei(ownerUSDCdpTokenBalance)}`);

    // DU tokens addresses
    const bdslaDUTokenAddress = await sla.duTokenRegistry(bdslaToken.address);
    // const daiDUTokenAddress = await sla.duTokenRegistry(daiToken.address);
    // const usdcDUTokenAddress = await sla.duTokenRegistry(usdcToken.address);
    console.log(`duDSLA token address is: ${bdslaDUTokenAddress}`);
    // console.log(`duDAI token address is: ${daiDUTokenAddress}`);
    // console.log(`duUSDC token address is: ${usdcDUTokenAddress}`);

    // notOwner dp token balances
    const bdslaDUToken = await IERC20.at(bdslaDUTokenAddress);
    // const daiDUToken = await IERC20.at(daiDUTokenAddress);
    // const usdcDUToken = await IERC20.at(usdcDUTokenAddress);
    const notOwnerDSLAduTokenBalance = await bdslaDUToken.balanceOf(notOwner);
    // const notOwnerDAIdpuokenBalance = await daiDUToken.balanceOf(notOwner);
    // const notOwnerUSDCduTokenBalance = await usdcDUToken.balanceOf(notOwner);
    console.log(`notOwner duDSLA token balance is: ${fromWei(notOwnerDSLAduTokenBalance)}`);
    // console.log(`notOwner duDAI token balance is: ${fromWei(notOwnerDAIdpuokenBalance)}`);
    // console.log(`notOwner duUSDC token balance is: ${fromWei(notOwnerUSDCduTokenBalance)}`);

    callback(null);
  } catch (error) {
    callback(error);
  }
};
