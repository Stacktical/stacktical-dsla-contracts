const { eventListener } = require('../../utils');

const SLARegistry = artifacts.require('SLARegistry');
const SLA = artifacts.require('SLA');

module.exports = async (callback) => {
  try {
    console.log('Starting SLI request process');
    const slaRegistry = await SLARegistry.deployed();
    const [owner] = await web3.eth.getAccounts();
    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
    console.log(`SLA address: ${slaAddresses[slaAddresses.length - 1]}`);

    const ownerApproval = true;
    console.log('Starting automated job 1: Request SLI for period 0');
    await slaRegistry.requestSLI(0, sla.address, ownerApproval);
    await eventListener(sla, 'SLICreated');

    // console.log('Starting automated job 2: Request SLI for period 1');
    // await slaRegistry.requestSLI(1, sla.address, ownerApproval);
    // await eventListener(sla, 'SLICreated');

    console.log('SLI request process finished');

    callback(null);
  } catch (error) {
    callback(error);
  }
};
