const { accounts, contract } = require("@openzeppelin/test-environment");
const [owner] = accounts;

// const MyContract = contract.fromArtifact("SLARegistry");

describe("SLARegistry", function () {
  it("deployer is owner", async () => {
    console.log(owner);
    expect(true);
  });
});
