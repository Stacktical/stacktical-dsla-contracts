const { cleanSolidityString } = require("./helpers");
const SLA = artifacts.require("SLA");
const SLARegistry = artifacts.require("SLARegistry");
const Messenger = artifacts.require("Messenger");
const bDSLAToken = artifacts.require("bDSLAToken");

const { toWei } = web3.utils;
const { testEnv } = require("../environments.config");

const initialTokenSupply = "100";
const stakeAmount1 = toWei(String(initialTokenSupply / 10));
const stakeAmount2 = toWei(String(initialTokenSupply / 5));
const periodId = 0;

const slaConstructor = {
  _owner: "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", //not used
  _SLONames: [
    "0x7374616b696e675f656666696369656e63790000000000000000000000000000",
  ],
  _SLOs: ["0x7f0A3d2BC5DcCE0936153eF5C592D5d5fF3c4551"],
  _stake: toWei("0"),
  _ipfsHash: "QmWngSpudqbLSPxd5VhN5maSKRmjZvTjapfFYig5qqkwTS",
  _sliInterval: "604800",
  _tokenAddress: "0x653157C7B46A81F106Ae0990E9B23DBFEAA0145F", // not used
  _sla_period_starts: [
    "1602633600",
    "1603238400",
    "1603843200",
    "1604448000",
    "1605052800",
  ],
  _sla_period_ends: [
    "1603238400",
    "1603843200",
    "1604448000",
    "1605052800",
    "1605657600",
  ],
};

describe("SLARegistry", function () {
  let owner, notOwners, bDSLA, newToken, messenger, slaRegistry;
  let SLAs = [];

  beforeEach(async function () {
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
    slaRegistry = await SLARegistry.new(messenger.address);

    // Register the SLAs
    const {
      _SLONames,
      _SLOs,
      _stake,
      _ipfsHash,
      _sliInterval,
      _sla_period_starts,
      _sla_period_ends,
    } = slaConstructor;

    await slaRegistry.createSLA(
      owner,
      _SLONames,
      _SLOs,
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
      _SLONames,
      _SLOs,
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
});
