const SLO = artifacts.require("SLO");
const SLORegistry = artifacts.require("SLORegistry");

const { sloTypes } = require("./helpers/constants");
const { utf8ToHex, hexToUtf8 } = web3.utils;
const { expect } = require("chai");

const sloName = "staking_efficiency";
const sloValue = 97000;

describe("SLARegistry", function () {
  let owner, notOwners, sloRegistry;

  beforeEach(async function () {
    const accounts = await web3.eth.getAccounts();
    const [Owner, ...NotOwners] = accounts;
    owner = Owner;
    notOwners = NotOwners;
    sloRegistry = await SLORegistry.new();
  });

  it("should create a SLO correctly", async function () {
    for (let sloType in sloTypes) {
      const sloNameBytes = utf8ToHex(sloName + sloType);
      await sloRegistry.createSLO(sloValue, sloType, sloNameBytes);
    }

    const userSlos = await sloRegistry.userSLOs.call(owner);
    for (let userSlo in userSlos) {
      const slo = await SLO.at(userSlos[userSlo]);
      const deployedSloNameBytes = await slo.name.call();
      const deployedSloType = await slo.SLOType.call();
      const deployedSloValue = await slo.value.call();
      const deployedSloName = hexToUtf8(deployedSloNameBytes);
      expect(deployedSloName).to.equal(sloName + userSlo);
      expect(deployedSloType.toString()).to.equal(userSlo);
      expect(deployedSloValue.toString()).to.equal(String(sloValue));
    }
  });
});
