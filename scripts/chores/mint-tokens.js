const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');
const initialTokenSupply = '1000000000';

const { toWei } = web3.utils;

module.exports = async (callback) => {
  try {
    console.log('Minting tokens to owner and notOwner');
    const [owner, notOwner] = await web3.eth.getAccounts();

    const bdslaToken = await bDSLA.deployed();
    const daiToken = await DAI.deployed();
    const usdcToken = await USDC.deployed();
    // mint to owner
    await bdslaToken.mint(owner, toWei(initialTokenSupply));
    await usdcToken.mint(owner, toWei(initialTokenSupply));
    await daiToken.mint(owner, toWei(initialTokenSupply));
    // mint to notOwner
    await bdslaToken.mint(notOwner, toWei(initialTokenSupply));
    await usdcToken.mint(notOwner, toWei(initialTokenSupply));
    await daiToken.mint(notOwner, toWei(initialTokenSupply));

    callback(null);
  } catch (error) {
    callback(error);
  }
};
