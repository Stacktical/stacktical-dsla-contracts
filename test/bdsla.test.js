const bDSLA = artifacts.require('bDSLA');
const { fromWei, toWei } = web3.utils;
const { expect } = require('chai');

let token;

describe('bDSLA', () => {
  let owner;
  let notOwner;

  beforeEach(async () => {
    const accounts = await web3.eth.getAccounts();
    // eslint-disable-next-line prefer-destructuring
    [owner, notOwner] = accounts;
    // eslint-disable-next-line prefer-destructuring
    token = await bDSLA.new({ from: owner });
  });

  it('should deploy without minting at deployment', async () => {
    const ownerBalance = await token.balanceOf(owner);
    expect(fromWei(ownerBalance)).to.equal('0');
  });

  it('should let any user to mint bDSLA tokens', async () => {
    const mintedTokens = '100';
    let ownerBalance = await token.balanceOf(owner);
    expect(fromWei(ownerBalance)).to.equal('0');
    await token.mint(owner, toWei(mintedTokens), { from: owner });
    ownerBalance = await token.balanceOf(owner);
    expect(fromWei(ownerBalance)).to.equal(mintedTokens);

    let notOwnerBalance = await token.balanceOf(notOwner);
    expect(fromWei(notOwnerBalance)).to.equal('0');
    await token.mint(notOwner, toWei(mintedTokens), { from: notOwner });
    notOwnerBalance = await token.balanceOf(notOwner);
    expect(fromWei(notOwnerBalance)).to.equal(mintedTokens);
  });
});
