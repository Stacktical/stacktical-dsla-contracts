const axios = require('axios');
const { envParameters } = require('../environments.config');

const { fromWei } = web3.utils;

const SLARegistry = artifacts.require('SLARegistry');
const Messenger = artifacts.require('Messenger');
const IERC20 = artifacts.require('IERC20');
const baseURL = envParameters.chainlinkNodeUrl;

const getSessionCookie = async () => {
  const resp = await axios({
    method: 'post',
    url: `${baseURL}/sessions`,
    headers: {
      'Content-Type': 'application/json',
    },
    data: {
      email: 'test@stacktical.com',
      password: 'password',
    },
  });
  return resp.headers['set-cookie'];
};

const getLinkTokenAddress = async () => {
  const sessionCookie = await getSessionCookie();
  const { data } = await axios({
    method: 'get',
    url: `${baseURL}/v2/config`,
    headers: {
      Cookie: sessionCookie,
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return data.data.attributes.linkContractAddress;
};

const periodId = 4;
const sloName = '0x7374616b696e675f656666696369656e63790000000000000000000000000000';

module.exports = async (callback) => {
  try {
    const linkTokenAddress = await getLinkTokenAddress();
    const linkToken = await IERC20.at(linkTokenAddress);
    console.log('LINK address:', linkTokenAddress);
    const messenger = await Messenger.deployed();
    console.log('Messenger address:', messenger.address);
    const messengerBalance = await linkToken.balanceOf(messenger.address);
    console.log('Messenger LINK balance:', fromWei(messengerBalance));
    if (fromWei(messengerBalance) === '0') {
      callback('Messenger has no funds');
    }
    const slaRegistry = await SLARegistry.deployed();
    const allSlas = await slaRegistry.allSLAs.call();
    if (allSlas.length === 0) {
      callback('No SLA deployed');
    }
    const [sla] = allSlas;
    await slaRegistry.requestSLI(periodId, sla, sloName);
    callback(null);
  } catch (error) {
    callback(error);
  }
};
