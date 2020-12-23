const { expect } = require("chai");

const IERC20 = artifacts.require("IERC20");
const SLA = artifacts.require("SLA");
const SLARegistry = artifacts.require("SLARegistry");
const SLORegistry = artifacts.require("SLORegistry");
const Messenger = artifacts.require("Messenger");
const bDSLAToken = artifacts.require("bDSLAToken");

const { slaConstructor } = require("./helpers/constants");
const { getSLI, eventListener, cleanSolidityString } = require("./helpers");
const { testEnv } = require("../environments.config");
const { toWei, utf8ToHex } = web3.utils;

const initialTokenSupply = "100";
const stakeAmount1 = toWei(String(initialTokenSupply / 10));
const stakeAmount2 = toWei(String(initialTokenSupply / 5));
const periodId = 0;
const sloValue = 95000;
const sloName = "staking_efficiency";

describe("SLARegistry", function () {
  let owner,
    notOwners,
    bDSLA,
    newToken,
    messenger,
    slaRegistry,
    chainlinkToken,
    sloRegistry,
    userSlos;
  let SLAs = [];

  beforeEach(async function () {
    SLAs.length = 0;
    const accounts = await web3.eth.getAccounts();
    const [Owner, ...NotOwners] = accounts;
    owner = Owner;
    notOwners = NotOwners;

    bDSLA = await bDSLAToken.new();
    await bDSLA.mint(owner, toWei(initialTokenSupply));
    newToken = await bDSLAToken.new(); // to simulate a new token
    await newToken.mint(owner, toWei(initialTokenSupply));

    messenger = await Messenger.new(
      testEnv.chainlinkOracleAddress,
      testEnv.chainlinkTokenAddress,
      testEnv.chainlinkJobId
    );

    chainlinkToken = await IERC20.at(testEnv.chainlinkTokenAddress);

    slaRegistry = await SLARegistry.new(messenger.address);

    sloRegistry = await SLORegistry.new();
    const sloNameHex = utf8ToHex(sloName);
    // 4 is "GreatherThan"
    await sloRegistry.createSLO(sloValue, 4, sloNameHex);
    userSlos = await sloRegistry.userSLOs.call(owner);

    // Register the SLAs
    const {
      _stake,
      _ipfsHash,
      _sliInterval,
      _sla_period_starts,
      _sla_period_ends,
    } = slaConstructor;

    await slaRegistry.createSLA(
      owner,
      [sloNameHex],
      userSlos,
      _stake,
      _ipfsHash,
      _sliInterval,
      bDSLA.address,
      _sla_period_starts,
      _sla_period_ends,
      { from: owner }
    );

    await slaRegistry.createSLA(
      owner,
      [sloNameHex],
      userSlos,
      _stake,
      _ipfsHash,
      _sliInterval,
      bDSLA.address,
      _sla_period_starts,
      _sla_period_ends,
      { from: owner }
    );

    const slaAddresses = await slaRegistry.userSLAs(owner);
    const sla1 = await SLA.at(slaAddresses[0]);
    const sla2 = await SLA.at(slaAddresses[1]);
    SLAs.push(sla1, sla2);
  });

  it("should ask for active pool correctly", async function () {
    const [sla1, sla2] = SLAs;
    await bDSLA.approve(sla1.address, stakeAmount1);
    await newToken.approve(sla2.address, stakeAmount2);
    await sla1.stakeTokens(stakeAmount1, bDSLA.address, periodId);

    // add newToken as allowed token
    await sla2.addAllowedTokens(newToken.address);
    await sla2.stakeTokens(stakeAmount2, newToken.address, periodId);
    const activePools = await slaRegistry.getActivePool(owner);
    assert.equal(
      activePools.length,
      SLAs.length,
      "active pools should only be equal to SLAs length"
    );

    const [pool1, pool2] = activePools;
    const bDSLAName = await bDSLA.name.call();
    const newTokenName = await newToken.name.call();

    assert.equal(pool1.stake, stakeAmount1, "stakes for SLA 1 does not match");
    assert.equal(pool2.stake, stakeAmount2, "stakes for SLA 2 does not match");
    assert.equal(
      cleanSolidityString(pool1.assetName),
      bDSLAName,
      "names for SLA 1 does not match"
    );
    assert.equal(
      cleanSolidityString(pool2.assetName),
      newTokenName,
      "names for SLA 2 does not match"
    );
    assert.equal(
      pool1.SLAaddress,
      sla1.address,
      "addresses for SLA 1 does not match"
    );
    assert.equal(
      pool2.SLAaddress,
      sla2.address,
      "addresses for SLA 2 does not match"
    );
  });

  it("should ask for a SLI properly", async () => {
    const SLICreatedEvent = "SLICreated";
    const [sla1] = SLAs;
    const { _sla_period_starts, _sla_period_ends } = slaConstructor;
    const sloName = userSlos[0];
    const periodStart = _sla_period_starts[periodId];
    const periodEnd = _sla_period_ends[periodId];

    // Fund the messenger contract with LINK
    await chainlinkToken.transfer(messenger.address, web3.utils.toWei("0.2"));
    await slaRegistry.requestSLI(periodId, sla1.address, sloName);
    const eventDetected = await eventListener(sla1, SLICreatedEvent);
    const expectedSLI1 = await getSLI(sla1.address, periodStart, periodEnd);
    const expectedResponse = {
      name: SLICreatedEvent,
      values: {
        _value: String(expectedSLI1 * 1000),
        _periodId: String(periodId),
      },
    };
    expect(eventDetected.name).to.equal(expectedResponse.name);
    expect(eventDetected.values).to.include(expectedResponse.values);
  });
});
