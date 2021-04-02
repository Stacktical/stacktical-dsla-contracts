const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const SEMessenger = artifacts.require('SEMessenger');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const Details = artifacts.require('Details');
const bDSLA = artifacts.require('bDSLA');
const USDC = artifacts.require('USDC');
const DAI = artifacts.require('DAI');

const fs = require('fs');
const path = require('path');

const placeHolder = 'TBD';

const addresses = (adminWallet) => ({
  1: {
    DSLAToken: '0x3affcca64c2a6f4e3b6bd9c64cd2c969efd1ecbe', // mainnet don't use bDSLA
    SLORegistry:
      (SLORegistry.networks[1] && SLORegistry.networks[1].address)
      || placeHolder,
    SLARegistry:
      (SLARegistry.networks[1] && SLARegistry.networks[1].address)
      || placeHolder,
    AdminWallet: adminWallet,
    // https://etherscan.io/token/0x6b175474e89094c44da98b954eedeac495271d0f
    DAIToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
    USDCToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    MessengerRegistry:
      (MessengerRegistry.networks[1] && MessengerRegistry.networks[1].address)
      || placeHolder,
    PeriodRegistry:
      (PeriodRegistry.networks[1] && PeriodRegistry.networks[1].address)
      || placeHolder,
    StakeRegistry:
      (StakeRegistry.networks[1] && StakeRegistry.networks[1].address)
      || placeHolder,
    SEMessenger:
      (SEMessenger.networks[1] && SEMessenger.networks[1].address)
      || placeHolder,
    NetworkAnalytics:
      (NetworkAnalytics.networks[1] && NetworkAnalytics.networks[1].address)
      || placeHolder,
    Details:
      (Details.networks[1] && Details.networks[1].address)
      || placeHolder,
  },
  42: {
    DSLAToken:
      (bDSLA.networks[42] && bDSLA.networks[42].address)
      || placeHolder,
    USDCToken: (USDC.networks[42] && USDC.networks[42].address) || placeHolder,
    SLORegistry:
      (SLORegistry.networks[42] && SLORegistry.networks[42].address)
      || placeHolder,
    MessengerRegistry:
      (MessengerRegistry.networks[42] && MessengerRegistry.networks[42].address)
      || placeHolder,
    PeriodRegistry:
      (PeriodRegistry.networks[42] && PeriodRegistry.networks[42].address)
      || placeHolder,
    StakeRegistry:
      (StakeRegistry.networks[42] && StakeRegistry.networks[42].address)
      || placeHolder,
    SEMessenger:
      (SEMessenger.networks[42] && SEMessenger.networks[42].address)
      || placeHolder,
    NetworkAnalytics:
      (NetworkAnalytics.networks[42] && NetworkAnalytics.networks[42].address)
      || placeHolder,
    SLARegistry:
      (SLARegistry.networks[42] && SLARegistry.networks[42].address)
      || placeHolder,
    Details:
      (Details.networks[42] && Details.networks[42].address)
      || placeHolder,
    AdminWallet: adminWallet,
    DAIToken: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
  },
  1337: {
    DSLAToken:
      (bDSLA.networks[1337] && bDSLA.networks[1337].address)
      || placeHolder,
    DAIToken: (DAI.networks[1337] && DAI.networks[1337].address) || placeHolder,
    USDCToken: (USDC.networks[1337] && USDC.networks[1337].address) || placeHolder,
    SLORegistry:
      (SLORegistry.networks[1337] && SLORegistry.networks[1337].address)
      || placeHolder,
    MessengerRegistry:
      (MessengerRegistry.networks[1337] && MessengerRegistry.networks[1337].address)
      || placeHolder,
    PeriodRegistry:
      (PeriodRegistry.networks[1337] && PeriodRegistry.networks[1337].address)
      || placeHolder,
    StakeRegistry:
      (StakeRegistry.networks[1337] && StakeRegistry.networks[1337].address)
      || placeHolder,
    SEMessenger:
      (SEMessenger.networks[1337] && SEMessenger.networks[1337].address)
      || placeHolder,
    NetworkAnalytics:
      (NetworkAnalytics.networks[1337] && NetworkAnalytics.networks[1337].address)
      || placeHolder,
    SLARegistry:
      (SLARegistry.networks[1337] && SLARegistry.networks[1337].address)
      || placeHolder,
    Details:
      (Details.networks[1337] && Details.networks[1337].address)
      || placeHolder,
    AdminWallet: adminWallet,
  },
});

const base_path = '../exported-data';
const fileName = 'addresses.ts';
const startingLine = 'const addresses = ';
const finalLine = '\n\nexport default addresses';

module.exports = async (callback) => {
  try {
    const [owner] = await web3.eth.getAccounts();
    const formatedAddresses = addresses(owner);
    fs.writeFileSync(
      path.resolve(__dirname, `${base_path}/${fileName}`),
      startingLine + JSON.stringify(formatedAddresses) + finalLine,
    );
    callback(null);
  } catch (error) {
    callback(error);
  }
};
