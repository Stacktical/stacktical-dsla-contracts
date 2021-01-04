const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLO = artifacts.require('SLO');
const SLORegistry = artifacts.require('SLORegistry');
const bDSLAToken = artifacts.require('bDSLAToken');
const fs = require('fs');
const path = require('path');

const files = {
  SLA: {
    constName: 'export const SLAABI: AbiItem[] =',
    tsFileName: 'SLAABI.ts',
    abi: SLA.abi,
  },
  SLARegistry: {
    constName: 'export const SLARegistryABI: AbiItem[] =',
    tsFileName: 'SLARegistryABI.ts',
    abi: SLARegistry.abi,
  },
  SLO: {
    constName: 'export const SLOABI: AbiItem[] =',
    tsFileName: 'SLOABI.ts',
    abi: SLO.abi,
  },
  SLORegistry: {
    constName: 'export const SLORegistryABI: AbiItem[] =',
    tsFileName: 'SLORegistryABI.ts',
    abi: SLORegistry.abi,
  },
  bDSLAToken: {
    constName: 'export const erc20ABI: AbiItem[] =',
    tsFileName: 'erc20ABI.ts',
    abi: bDSLAToken.abi,
  },
};

const base_path = '../exported-data';
const importAbiItem = "import { AbiItem } from 'web3-utils/types';\n\n";

module.exports = async (callback) => {
  try {
    for (const file of Object.values(files)) {
      const { constName, tsFileName, abi } = file;
      fs.writeFileSync(
        path.resolve(__dirname, `${base_path}/${tsFileName}`),
        importAbiItem + constName + JSON.stringify(abi),
      );
    }
    callback(null);
  } catch (error) {
    callback(error);
  }
};
