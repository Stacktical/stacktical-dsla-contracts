const SLA = artifacts.require('SLA');
const SLARegistry = artifacts.require('SLARegistry');
const SLORegistry = artifacts.require('SLORegistry');
const PeriodRegistry = artifacts.require('PeriodRegistry');
const MessengerRegistry = artifacts.require('MessengerRegistry');
const StakeRegistry = artifacts.require('StakeRegistry');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const bDSLA = artifacts.require('bDSLA');
const Details = artifacts.require('Details');
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
  SLORegistry: {
    constName: 'export const SLORegistryABI: AbiItem[] =',
    tsFileName: 'SLORegistryABI.ts',
    abi: SLORegistry.abi,
  },
  PeriodRegistry: {
    constName: 'export const PeriodRegistryABI: AbiItem[] =',
    tsFileName: 'PeriodRegistryABI.ts',
    abi: PeriodRegistry.abi,
  },
  StakeRegistry: {
    constName: 'export const StakeRegistryABI: AbiItem[] =',
    tsFileName: 'StakeRegistryABI.ts',
    abi: StakeRegistry.abi,
  },
  MessengerRegistry: {
    constName: 'export const MessengerRegistryABI: AbiItem[] =',
    tsFileName: 'MessengerRegistryABI.ts',
    abi: MessengerRegistry.abi,
  },
  Details: {
    constName: 'export const DetailsABI: AbiItem[] =',
    tsFileName: 'DetailsABI.ts',
    abi: Details.abi,
  },
  NetworkAnalytics: {
    constName: 'export const NetworkAnalyticsABI: AbiItem[] =',
    tsFileName: 'NetworkAnalyticsABI.ts',
    abi: NetworkAnalytics.abi,
  },
  bDSLA: {
    constName: 'export const erc20ABI: AbiItem[] =',
    tsFileName: 'erc20ABI.ts',
    abi: bDSLA.abi,
  },
};

const base_path = '../../exported-data';
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
