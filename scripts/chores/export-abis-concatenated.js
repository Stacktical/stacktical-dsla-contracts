const SLA = artifacts.require('SLA');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const fs = require('fs');
const path = require('path');

const abis = {
  SLA: {
    name: 'SLAABI',
    abi: SLA.abi,
  },
  NetworkAnalytics: {
    name: 'NetworkAnalyticsABI',
    abi: NetworkAnalytics.abi,
  },
};

const filename = 'ABISConcatenated.js';
const base_path = '../../exported-data';

module.exports = async (callback) => {
  let abisContent = '';
  let abisModuleExports = 'module.exports = {\n';

  for (const element of Object.values(abis)) {
    const { name, abi } = element;
    abisContent += `const ${name} = ${JSON.stringify(abi)}\n\n`;
    abisModuleExports += `${name},\n`;
  }

  abisModuleExports += '};';

  try {
    fs.writeFileSync(
      path.resolve(__dirname, `${base_path}/${filename}`),
      abisContent + abisModuleExports,
    );

    callback(null);
  } catch (error) {
    callback(error);
  }
};
