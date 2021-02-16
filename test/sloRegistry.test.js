/* eslint-disable */

const { expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

const SLORegistry = artifacts.require("SLORegistry");
const { sloTypes } = require("../constants");

const sloValue = 97000;

describe("SLORegistry", () => {
  let sloRegistry;

  beforeEach(async () => {
    sloRegistry = await SLORegistry.new();
  });

  it("should create a SLO correctly", async () => {
    for (const sloType in sloTypes) {
      const receipt = await sloRegistry.createSLO(sloValue, sloType);
      expectEvent(receipt, "SLOCreated");
    }

    for (const sloType in sloTypes) {
      const registeredSLO = await sloRegistry.sloAddresses(sloValue, sloType);
      expect(registeredSLO).not.to.equal(
        "0x0000000000000000000000000000000000000000"
      );
    }
  });
  it("should not create a SLO twice", async () => {
    await sloRegistry.createSLO(sloValue, 0);
    await expectRevert.unspecified(sloRegistry.createSLO(sloValue, 0));
  });
});
