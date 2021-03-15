const moment = require('moment');

const Migrations = artifacts.require('./Migrations.sol');

const { generateWeeklyPeriods } = require('../utils');

module.exports = (deployer) => {
  deployer.deploy(Migrations);
  const [periodStarts, periodEnds] = generateWeeklyPeriods(52, 6);
  const periodStartsDate = periodStarts.map((date) => moment(date * 1000).utc(0).format('DD/MM/YYYY HH:mm:ss'));
  const periodEndsDate = periodEnds.map((date) => moment(date * 1000).utc(0).format('DD/MM/YYYY HH:mm:ss'));
  console.log(periodStartsDate, periodEndsDate);
  console.log(periodStarts, periodEnds);
};
