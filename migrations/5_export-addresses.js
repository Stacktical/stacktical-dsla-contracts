/* eslint-disable no-return-assign */
require('babel-polyfill');
require('babel-register');

const fs = require('fs');
const path = require('path');
const { networkNames, getEnvFromNetwork } = require('../environments');

const PeriodRegistry = artifacts.require('PeriodRegistry');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
const Details = artifacts.require('Details');
const PreCoordinator = artifacts.require('PreCoordinator');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const SEMessenger = artifacts.require('SEMessenger');
const StringUtils = artifacts.require('StringUtils');
const bDSLA = artifacts.require('bDSLA');
const DAI = artifacts.require('DAI');
const USDC = artifacts.require('USDC');

const base_path = '../exported-data/networks';

const getLines = (networkName) => [`const ${networkName} = `, `\n\nexport default ${networkName}`];

module.exports = (deployer, network) => {
  deployer.then(async () => {
    console.log(`Creating addresses file for ${network}`);
    const envParameters = getEnvFromNetwork(network);
    const [startingLine, finalLine] = getLines(network);
    const addresses = {
      DSLAToken: envParameters.dslaTokenAddress || (await bDSLA.deployed()).address,
      DAIToken: envParameters.daiTokenAddress || (await DAI.deployed()).address,
      USDCToken: envParameters.usdcTokenAddress || (await USDC.deployed()).address,
      SLORegistry: (await SLORegistry.deployed()).address,
      SLARegistry: (await SLARegistry.deployed()).address,
      MessengerRegistry: (await MessengerRegistry.deployed()).address,
      PeriodRegistry: (await PeriodRegistry.deployed()).address,
      StakeRegistry: (await StakeRegistry.deployed()).address,
      SEMessenger: (await SEMessenger.deployed()).address,
      NetworkAnalytics: (await NetworkAnalytics.deployed()).address,
      Details: (await Details.deployed()).address,
      PreCoordinator: (await PreCoordinator.deployed()).address,
      StringUtils: (await StringUtils.deployed()).address,
    };
    fs.writeFileSync(
      path.resolve(__dirname, `${base_path}/${network}.ts`),
      startingLine + JSON.stringify(addresses) + finalLine,
    );

    console.log('Updating index.ts file with networks addresses');
    const importLines = Object.values(networkNames).reduce(
      (r, name) => (r += `import ${name} from './${name}'\n`),
      '',
    );
    const exportLines = Object.values(networkNames).reduce((r, name) => (r += `${name}, `), '');

    fs.writeFileSync(
      path.resolve(__dirname, `${base_path}/index.ts`),
      `${importLines}\n \n export{ \n ${exportLines} }`,
    );
  });
};
