const DAI = artifacts.require("DAI");

module.exports = async (callback) => {
  try {
    const [owner] = await web3.eth.getAccounts();
    console.log("Owner address is: " + owner);
    const token = await DAI.deployed();
    await token.mint(owner, web3.utils.toWei("100000"));
    const balance = await token.balanceOf(owner);
    console.log("Owner balance is: " + balance);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
