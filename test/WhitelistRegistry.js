const WhitelistRegistry = artifacts.require("WhitelistRegistry");
const Whitelist = artifacts.require("Whitelist");

contract("WhitelistRegistry", async accounts => {
  const owner = accounts[5]

  it("Should deploy whitelist contracts", async () => {
    const registryInstance = await WhitelistRegistry.deployed()
    await registryInstance.createWhitelist({ from: owner })
    const userWhitelists = await registryInstance.userWhitelists(owner)
    const whitelistInstance = await Whitelist.at(userWhitelists[0])

    assert.equal(
      await whitelistInstance.isOwner({ from: owner }),
      true,
      "Owner was not correctly set"
    )
  })
})
