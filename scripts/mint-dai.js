const DAI = artifacts.require("DAI");

module.exports = async (callback) => {
  try {
    const [owner, notOwner] = await web3.eth.getAccounts();
    const account = process.env.NOT_OWNER ? notOwner : owner;
    console.log("Owner address is: " + account);
    const token = await DAI.deployed();
    await token.mint(account, web3.utils.toWei("100000"));
    const balance = await token.balanceOf(account);
    console.log("Owner balance is: " + balance);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
