const SLA = artifacts.require("SLA");
const SLARegistry = artifacts.require("SLARegistry");
const SLO = artifacts.require("SLO");
const SLORegistry = artifacts.require("SLORegistry");
const bDSLAToken = artifacts.require("bDSLAToken");
const fs = require("fs");
const path = require("path");

const files = {
  SLA: {
    constName: "export const SLAABI: Array<object> =",
    tsFileName: "SLAABI.ts",
    abi: SLA.abi,
  },
  SLARegistry: {
    constName: "export const SLARegistryABI: Array<object> =",
    tsFileName: "SLARegistryABI.ts",
    abi: SLARegistry.abi,
  },
  SLO: {
    constName: "export const SLOABI: Array<object> =",
    tsFileName: "SLOABI.ts",
    abi: SLO.abi,
  },
  SLORegistry: {
    constName: "export const SLORegistryABI: Array<object> =",
    tsFileName: "SLORegistryABI.ts",
    abi: SLORegistry.abi,
  },
  bDSLAToken: {
    constName: "export const erc20ABI: Array<object> =",
    tsFileName: "erc20ABI.ts",
    abi: bDSLAToken.abi,
  },
};

const base_path = "../exported_data";

module.exports = async (callback) => {
  try {
    for (file of Object.values(files)) {
      const { constName, tsFileName, abi } = file;
      fs.writeFileSync(
        path.resolve(__dirname, base_path + "/" + tsFileName),
        constName + JSON.stringify(abi)
      );
    }
    callback(null);
  } catch (error) {
    callback(error);
  }
};
