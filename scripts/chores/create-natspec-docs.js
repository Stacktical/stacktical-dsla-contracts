const fs = require('fs');
const path = require('path');

const documentedContracts = [
  'SLA',
  'SLORegistry',
  'SLARegistry',
  'bDSLA',
  'MessengerRegistry',
  'IMessenger',
  'SEMessenger',
  'StakeRegistry',
  'PeriodRegistry',
  'NetworkAnalytics',
  'Staking',
  'Details',
];

const basePath = '../../natspec-docs';
const devPath = '';
const userPath = '/userdoc';
const fileExtension = '.json';

// sort object fields by value ascending
const sortObject = (object) => Object.fromEntries(
  Object.entries(object).sort(
    ([, a], [, b]) => a.split('.')[0] - b.split('.')[0],
  ),
);

const sortMethods = (devdoc) => {
  for (const method of Object.entries(devdoc.methods)) {
    const methodKey = method[0];
    const methodValue = method[1];
    if (methodValue.params && Object.keys(methodValue.params).length > 1) {
      methodValue.params = sortObject(methodValue.params);
    }
    devdoc.methods[methodKey] = methodValue;
  }
};

const sortEvents = (devdoc) => {
  for (const event of Object.entries(devdoc.events)) {
    const eventKey = event[0];
    const eventValue = event[1];
    if (eventValue.params && Object.keys(eventValue.params).length > 1) {
      eventValue.params = sortObject(eventValue.params);
    }
    devdoc.events[eventKey] = eventValue;
  }
};

module.exports = async (callback) => {
  try {
    for (const contract of documentedContracts) {
      const { devdoc, userdoc } = artifacts.require(contract);

      // sort params to match the order of params of the signature
      if (devdoc.methods) sortMethods(devdoc);
      if (devdoc.events) sortEvents(devdoc);

      fs.writeFileSync(
        path.resolve(
          __dirname,
          `${basePath + devPath}/${contract}${fileExtension}`,
        ),
        JSON.stringify(devdoc),
      );
      fs.writeFileSync(
        path.resolve(
          __dirname,
          `${basePath + userPath}/${contract}${fileExtension}`,
        ),
        JSON.stringify(userdoc),
      );
    }
    callback(null);
  } catch (error) {
    callback(error);
  }
};
