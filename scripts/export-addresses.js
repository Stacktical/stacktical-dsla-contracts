const SLARegistry = artifacts.require("SLARegistry");
const SLORegistry = artifacts.require("SLORegistry");
const bDSLAToken = artifacts.require("bDSLAToken");

const fs = require("fs");
const path = require("path");

const placeHolder = "TBD";

const addresses = (adminWallet) => ({
  1: {
    DSLAToken: "0x3affcca64c2a6f4e3b6bd9c64cd2c969efd1ecbe", // mainnet don't use bDSLA
    SLORegistry:
      (SLORegistry.networks[1] && SLORegistry.networks[1].address) ||
      placeHolder,
    SLARegistry:
      (SLARegistry.networks[1] && SLARegistry.networks[1].address) ||
      placeHolder,
    AdminWallet: adminWallet,
  },
  42: {
    DSLAToken:
      (bDSLAToken.networks[42] && bDSLAToken.networks[42].address) ||
      placeHolder,
    SLORegistry:
      (SLORegistry.networks[42] && SLORegistry.networks[42].address) ||
      placeHolder,
    SLARegistry:
      (SLARegistry.networks[42] && SLARegistry.networks[42].address) ||
      placeHolder,
    AdminWallet: adminWallet,
  },
  1337: {
    DSLAToken:
      (bDSLAToken.networks[1337] && bDSLAToken.networks[1337].address) ||
      placeHolder,
    SLORegistry:
      (SLORegistry.networks[1337] && SLORegistry.networks[1337].address) ||
      placeHolder,
    SLARegistry:
      (SLARegistry.networks[1337] && SLARegistry.networks[1337].address) ||
      placeHolder,
    AdminWallet: adminWallet,
  },
});

const base_path = "../exported-data";
const fileName = "addresses.ts";
const startingLine = "const addresses = ";
const finalLine = "\n\nexport default addresses";

module.exports = async (callback) => {
  try {
    const [owner] = await web3.eth.getAccounts();
    const formatedAddresses = addresses(owner);
    fs.writeFileSync(
      path.resolve(__dirname, base_path + "/" + fileName),
      startingLine + JSON.stringify(formatedAddresses) + finalLine
    );

    callback(null);
  } catch (error) {
    callback(error);
  }
};
