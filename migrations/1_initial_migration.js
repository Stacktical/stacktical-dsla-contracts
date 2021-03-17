const moment = require('moment');

const Migrations = artifacts.require('./Migrations.sol');

const { generateWeeklyPeriods } = require('../utils');

module.exports = (deployer, network) => {
  if (/mainnet/i.test(network)) {
    console.log('Remember to:');
    console.log('- uncomment the periodHasFinished check at SLARegistry.createSLA');
    console.log('- set the correct values for StakeRegistry');
    console.log('- set the correct value for callerReward on NetworkAnalytics');
    console.log('- fund the deployer account with LINK (the funds are used through allowance)');
    console.log('- deploy the jobs and the Oracles for Chainlink nodes');
    console.log('- set the values for chainlink on 2_deploy_contracts');
    console.log('- test the change values functions');
    console.log('- publish the SEMessenger specification to IPFS');
    process.exit(0);
  }
  deployer.deploy(Migrations);
  const [periodStarts, periodEnds] = generateWeeklyPeriods(52, 6);
  const periodStartsDate = periodStarts.map((date) => moment(date * 1000).utc(0).format('DD/MM/YYYY HH:mm:ss'));
  const periodEndsDate = periodEnds.map((date) => moment(date * 1000).utc(0).format('DD/MM/YYYY HH:mm:ss'));
  console.log(periodStartsDate, periodEndsDate);
  console.log(periodStarts, periodEnds);
};
