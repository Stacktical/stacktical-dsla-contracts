const { SENetworkNamesBytes32 } = require('../../constants');
const { eventListener } = require('../../utils');

const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const SLARegistry = artifacts.require('SLARegistry');
const SLA = artifacts.require('SLA');
const periodType = 2;
const slaNetworkBytes32 = SENetworkNamesBytes32[0];

module.exports = async (callback) => {
  try {
    console.log('Starting SLI request process');
    const slaRegistry = await SLARegistry.deployed();
    const [owner] = await web3.eth.getAccounts();
    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla = await SLA.at(slaAddresses[slaAddresses.length - 1]);
    console.log(`SLA address: ${slaAddresses[slaAddresses.length - 1]}`);

    console.log('Starting automated job 1: Request Analytics and SLI for period 0');
    const networkAnalytics = await NetworkAnalytics.deployed();
    const ownerApproval = true;
    networkAnalytics.requestAnalytics(
      0,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');
    await slaRegistry.requestSLI(0, sla.address, ownerApproval);
    await eventListener(sla, 'SLICreated');

    console.log('Starting automated job 2: Request Analytics and SLI for period 1');
    networkAnalytics.requestAnalytics(
      1,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');
    await slaRegistry.requestSLI(1, sla.address, ownerApproval);
    await eventListener(sla, 'SLICreated');

    console.log('Starting automated job 3: Request Analytics for period 2');
    networkAnalytics.requestAnalytics(
      2,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');

    console.log('Starting automated job 4: Request Analytics for period 3');
    networkAnalytics.requestAnalytics(
      3,
      periodType,
      slaNetworkBytes32,
      ownerApproval,
    );
    await eventListener(networkAnalytics, 'AnalyticsReceived');
    console.log('SLI request process finished');

    callback(null);
  } catch (error) {
    callback(error);
  }
};
