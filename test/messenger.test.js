import { expect } from 'chai';
import { needsGetJobId, envParameters, getIndexerAPIUrl } from '../environments';
import { eventListener, getSLI, getChainlinkJobId } from './helpers';

const Messenger = artifacts.require('Messenger');
const MinimalSLA = artifacts.require('MinimalSLA');
const IERC20 = artifacts.require('IERC20');

describe('Messenger', () => {
  let messenger;
  let minimalSLA;
  let chainlinkToken;
  const slaMonitoringStart = '1577836800000000000';
  const slaMonitoringEnd = '1594026520000000000';
  const arbitrarySLOName = '0x4e69636b00000000000000000000000000000000000000000000000000000000';
  let owner;

  // eslint-disable-next-line no-undef
  before(async () => {
    [owner] = await web3.eth.getAccounts();
    // MinimalSLA creates a period on deployment time
    minimalSLA = await MinimalSLA.new(slaMonitoringStart, slaMonitoringEnd);
    messenger = await Messenger.new(
      await getIndexerAPIUrl(),
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      !needsGetJobId ? envParameters.chainlinkJobId : await getChainlinkJobId(),
    );
    chainlinkToken = await IERC20.at(envParameters.chainlinkTokenAddress);
    // Sets the owner as the SLARegistry
    await messenger.setSLARegistry({ from: owner });
  });

  it('should ask for a SLI value to the Chainlink Oracle', async () => {
    await chainlinkToken.transfer(messenger.address, web3.utils.toWei('0.1'));
    // MinimalSLA only has 1 period
    const minimalSLAPeriodId = 0;
    await messenger.requestSLI(
      minimalSLAPeriodId,
      minimalSLA.address,
      arbitrarySLOName,
    );
    await eventListener(messenger, 'SLIReceived');
    const storedSLI = await minimalSLA.SLIs.call(arbitrarySLOName, 0);
    const { timestamp, value, periodId } = storedSLI;
    assert.notEmpty(timestamp);
    assert.notEmpty(value);
    assert.equal(periodId, minimalSLAPeriodId);
    // Compare it with the sli obtained by the GraphQL API
    const stackticalSLI = await getSLI(
      minimalSLA.address,
      slaMonitoringStart,
      slaMonitoringEnd,
    );
    // the SLI is stored multiplied by 1000 and rounded by the Chainlink Job
    expect(stackticalSLI).to.equal(Number(value));
  });
});
