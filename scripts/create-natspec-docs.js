const fs = require("fs");
const path = require("path");

const documentedContracts = [
  "SLA",
  "SLO",
  "SLORegistry",
  "SLARegistry",
  "bDSLAToken",
  "Messenger",
];

const basePath = "../natspec-docs";
const devPath = "/devdoc";
const userPath = "/userdoc";
const fileExtension = ".json";

// sort object fields by value ascending
const sortObject = (object) =>
  Object.entries(object)
    .sort((a, b) => a[1] > b[1])
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});

const sortMethods = (devdoc) => {
  for (let method of Object.entries(devdoc.methods)) {
    const methodKey = method[0];
    const methodValue = method[1];
    if (methodValue.params && Object.keys(methodValue.params).length > 1) {
      methodValue.params = sortObject(methodValue.params);
    }
    devdoc.methods[methodKey] = methodValue;
  }
};

const sortEvents = (devdoc) => {
  for (let event of Object.entries(devdoc.events)) {
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
    for (let contract of documentedContracts) {
      const { devdoc, userdoc } = artifacts.require(contract);

      // sort params to match the order of params of the signature
      if (devdoc.methods) sortMethods(devdoc);
      if (devdoc.events) sortEvents(devdoc);

      fs.writeFileSync(
        path.resolve(
          __dirname,
          basePath + devPath + "/" + contract + fileExtension
        ),
        JSON.stringify(devdoc)
      );
      fs.writeFileSync(
        path.resolve(
          __dirname,
          basePath + userPath + "/" + contract + fileExtension
        ),
        JSON.stringify(userdoc)
      );
    }
    callback(null);
  } catch (error) {
    callback(error);
  }
};
