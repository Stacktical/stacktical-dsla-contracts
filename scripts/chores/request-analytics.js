const { SENetworkNamesBytes32 } = require('../../constants');
const { eventListener } = require('../../utils');

const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const periodType = 2;
const slaNetworkBytes32 = SENetworkNamesBytes32[0];

module.exports = async (callback) => {
  try {
    // console.log(NetworkAnalytics.link);
    // console.log(StringUtils.address);
    // NetworkAnalytics.link('StringUtils', StringUtils.address);
    console.log('Starting Analytics request process');

    const networkAnalytics = await NetworkAnalytics.deployed();
    const ownerApproval = true;

    console.log('Starting automated job 1: Request Analytics for period 0');
    await networkAnalytics.requestAnalytics(0, periodType, slaNetworkBytes32, ownerApproval);
    await eventListener(networkAnalytics, 'AnalyticsReceived');

    // console.log('Starting automated job 2: Request Analytics for period 1');
    // await networkAnalytics.requestAnalytics(1, periodType, slaNetworkBytes32, ownerApproval);
    // await eventListener(networkAnalytics, 'AnalyticsReceived');
    //
    // console.log('Starting automated job 3: Request Analytics for period 2');
    // await networkAnalytics.requestAnalytics(2, periodType, slaNetworkBytes32, ownerApproval);
    // await eventListener(networkAnalytics, 'AnalyticsReceived');
    //
    // console.log('Starting automated job 4: Request Analytics for period 3');
    // await networkAnalytics.requestAnalytics(3, periodType, slaNetworkBytes32, ownerApproval);
    // await eventListener(networkAnalytics, 'AnalyticsReceived');
    // console.log('Analytics request process finished');

    callback(null);
  } catch (error) {
    callback(error);
  }
};
