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
const fileNameDev = ".devdoc.json";
const fileNameUser = ".userdoc.json";

module.exports = async (callback) => {
  try {
    for (let contract of documentedContracts) {
      const { devdoc, userdoc } = artifacts.require(contract);
      fs.writeFileSync(
        path.resolve(
          __dirname,
          basePath + devPath + "/" + contract + fileNameDev
        ),
        JSON.stringify(devdoc)
      );
      fs.writeFileSync(
        path.resolve(
          __dirname,
          basePath + userPath + "/" + contract + fileNameUser
        ),
        JSON.stringify(userdoc)
      );
    }
    callback(null);
  } catch (error) {
    callback(error);
  }
};
