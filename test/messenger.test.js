import { testEnv } from "../environments.config";
import { eventListener, getSLI, web3ContractCreator } from "./helpers";

const Messenger = artifacts.require("Messenger");
const MinimalSLA = artifacts.require("MinimalSLA");
const IERC20 = artifacts.require("IERC20");

contract("Messenger", (accounts) => {
  let messenger;
  let minimalSLA;
  let web3Contract;
  let chainlinkToken;
  const owner = accounts[0];
  const slaMonitoringStart = "1577836800000000000";
  const slaMonitoringEnd = "1594026520000000000";
  const arbitrarySLOName =
    "0x4e69636b00000000000000000000000000000000000000000000000000000000";

  before(async () => {
    // MinimalSLA creates a period on deployment time
    minimalSLA = await MinimalSLA.new(slaMonitoringStart, slaMonitoringEnd);
    messenger = await Messenger.new(
      testEnv.chainlinkOracleAddress,
      testEnv.chainlinkTokenAddress,
      testEnv.chainlinkJobId
    );
    chainlinkToken = await IERC20.at(testEnv.chainlinkTokenAddress);
    // // Sets the owner as the SLARegistry
    await messenger.setSLARegistry({ from: owner });
    web3Contract = web3ContractCreator(Messenger.abi, messenger.address);
  });

  it("should ask for a SLI value to the Chainlink Oracle", async () => {
    await chainlinkToken.transfer(messenger.address, web3.utils.toWei("0.1"));
    // MinimalSLA only has 1 period
    const minimalSLAPeriodId = 0;
    await messenger.requestSLI(
      minimalSLAPeriodId,
      minimalSLA.address,
      arbitrarySLOName
    );
    await eventListener(web3Contract, "SLIReceived");
    const storedSLI = await minimalSLA.SLIs.call(arbitrarySLOName, 0);
    const { timestamp, value, periodId } = storedSLI;
    assert.notEmpty(timestamp);
    assert.notEmpty(value);
    assert.equal(periodId, minimalSLAPeriodId);
    // Compare it with the sli obtained by the GraphQL API
    const stackticalSLI = await getSLI(
      minimalSLA.address,
      slaMonitoringStart,
      slaMonitoringEnd
    );
    // the SLI is stored multiplied by 1000
    assert.equal(stackticalSLI * 1000, parseInt(value));
  });
});
