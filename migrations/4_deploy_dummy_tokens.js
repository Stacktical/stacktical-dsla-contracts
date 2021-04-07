require('babel-register');
require('babel-polyfill');

const { networkNames, getEnvFromNetwork } = require('../environments');

const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');

module.exports = (deployer, network) => {
  if (network !== networkNames.MAINNET) {
    deployer.then(async () => {
      if (!!process.env.ONLY_DETAILS === true) return;
      const envParameters = getEnvFromNetwork(network);
      if (!envParameters.daiTokenAddress) await deployer.deploy(DAI);
      if (!envParameters.usdcTokenAddress) await deployer.deploy(USDC);
    });
  }
};
