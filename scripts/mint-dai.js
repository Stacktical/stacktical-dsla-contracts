const DAI = artifacts.require('DAI');

module.exports = async (callback) => {
  try {
    const [owner] = await web3.eth.getAccounts();
    console.log(`Owner address is: ${owner}`);
    const token = await DAI.deployed();
    await token.mint(owner, web3.utils.toWei('1000000'));
    const balance = await token.balanceOf(owner);
    console.log(`Owner DAI balance is ${web3.utils.fromWei(balance)} DAI`);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
