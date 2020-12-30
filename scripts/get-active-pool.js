const SLARegistry = artifacts.require('SLARegistry');

module.exports = async (callback) => {
  try {
    const [owner] = await web3.eth.getAccounts();
    console.log(`Owner address is: ${owner}`);
    const slaRegistry = await SLARegistry.deployed();
    const activePool = await slaRegistry.getActivePool.call(owner);
    console.log('Active pool: ');
    console.log(activePool);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
