const USDC = artifacts.require('USDC');

module.exports = async (callback) => {
  try {
    const [owner] = await web3.eth.getAccounts();
    console.log(`Owner address is: ${owner}`);
    const token = await USDC.deployed();
    await token.mint(owner, web3.utils.toWei('1000000'));
    const balance = await token.balanceOf(owner);
    console.log(`Owner USDC balance is ${web3.utils.fromWei(balance)} USDC`);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
