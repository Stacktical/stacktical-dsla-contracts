const bDSLAToken = artifacts.require("bDSLAToken");
const { fromWei, toWei } = web3.utils;
const { expect } = require("chai");

let token;

describe("bDSLAToken", function () {
  let owner, notOwner;

  beforeEach(async function () {
    const accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    notOwner = accounts[1];
    token = await bDSLAToken.new({ from: owner });
  });

  it("should deploy without minting at deployment", async function () {
    const ownerBalance = await token.balanceOf(owner);
    expect(fromWei(ownerBalance)).to.equal("0");
  });

  it("should let any user to mint bDSLA tokens", async function () {
    const mintedTokens = "100";
    let ownerBalance = await token.balanceOf(owner);
    expect(fromWei(ownerBalance)).to.equal("0");
    await token.mint(owner, toWei(mintedTokens), { from: owner });
    ownerBalance = await token.balanceOf(owner);
    expect(fromWei(ownerBalance)).to.equal(mintedTokens);

    let notOwnerBalance = await token.balanceOf(notOwner);
    expect(fromWei(notOwnerBalance)).to.equal("0");
    await token.mint(notOwner, toWei(mintedTokens), { from: notOwner });
    notOwnerBalance = await token.balanceOf(notOwner);
    expect(fromWei(notOwnerBalance)).to.equal(mintedTokens);
  });
});
