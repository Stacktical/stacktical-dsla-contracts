import * as bs58 from 'bs58';
import { expect } from 'chai';
import axios from 'axios';
import { hexToUtf8, toAscii } from 'web3-utils';
import { needsGetJobId } from '../environments';
import { eventListener, generatePeriods, getChainlinkJobId } from './helpers';
import { networkNamesBytes32 } from '../constants';

const PeriodRegistry = artifacts.require('PeriodRegistry');
const IERC20 = artifacts.require('IERC20');
const NetworkAnalytics = artifacts.require('NetworkAnalytics');
const { envParameters } = require('../environments');

const periodId = 0;
// period type 2 is weekly
const periodType = 2;
const apy = 13;
const yearlyPeriods = 52;
const [periodStarts, periodEnds] = generatePeriods(10);
const networkNameBytes32 = networkNamesBytes32[0];

describe('NetworkAnalytics', () => {
  let owner;
  let notOwner;
  let chainlinkToken;
  let periodRegistry;
  let networkAnalytics;

  before(async () => {
    // deploy tokens
    [owner, notOwner] = await web3.eth.getAccounts();

    // 4 is "GreatherThan"
    periodRegistry = await PeriodRegistry.new();
    await periodRegistry.initializePeriod(
      periodType,
      periodStarts,
      periodEnds,
      apy,
      yearlyPeriods,
    );
    networkAnalytics = await NetworkAnalytics.new(
      envParameters.chainlinkOracleAddress,
      envParameters.chainlinkTokenAddress,
      !needsGetJobId ? envParameters.chainlinkJobId : await getChainlinkJobId(),
      periodRegistry.address,
    );
  });

  beforeEach(async () => {
    chainlinkToken = await IERC20.at(envParameters.chainlinkTokenAddress);
  });

  it('should ask for analytics to Chainlink correctly', async () => {
    const AnalyticsReceivedEvent = 'AnalyticsReceived';

    // Fund the stakingEfficiencyMessenger contract with LINK
    await chainlinkToken.transfer(
      networkAnalytics.address,
      web3.utils.toWei('0.1'),
    );

    await networkAnalytics.addNetwork(networkNameBytes32);

    await networkAnalytics.requestAnalytics(
      periodId,
      periodType,
      networkNameBytes32,
    );
    const {
      values: {
        networkName: _networkName,
        periodType: _periodType,
        periodId: _periodId,
        ipfsHash: _ipfsHash,
      },
    } = await eventListener(networkAnalytics, AnalyticsReceivedEvent);
    expect(hexToUtf8(_networkName)).to.equal(hexToUtf8(networkNameBytes32));
    expect(Number(_periodType)).to.equal(periodType);
    expect(Number(_periodId)).to.equal(periodId);
    const ipfsCID = bs58.encode(
      Buffer.from(`1220${_ipfsHash.replace('0x', '')}`, 'hex'),
    );
    const { data: periodAnalytics } = await axios.get(
      `https://ipfs.dsla.network/ipfs/${ipfsCID}`,
    );
    expect(periodAnalytics.period_id).to.equal('0');
    expect(periodAnalytics.period_type).to.equal('Weekly');
    // // (networkName=>periodType=>periodId=>bytes32)
    const periodAnalyticsIPFSCID = await networkAnalytics.periodAnalytics.call(
      networkNameBytes32,
      periodType,
      periodId,
    );
    expect(periodAnalyticsIPFSCID).to.equal(_ipfsHash);
  });
});
