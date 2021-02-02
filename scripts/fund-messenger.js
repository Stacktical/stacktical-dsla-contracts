const axios = require('axios');
const { envParameters } = require('../environments');

const IERC20 = artifacts.require('IERC20');
const Messenger = artifacts.require('Messenger');

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

const getChainlinkContractAddress = async () => {
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

const { toWei, fromWei } = web3.utils;

module.exports = async (callback) => {
  try {
    const messenger = await Messenger.deployed();
    console.log('Messenger address:', messenger.address);
    const linkTokenAddress = await getChainlinkContractAddress();
    console.log('LINK address:', linkTokenAddress);
    const linkToken = await IERC20.at(linkTokenAddress);
    let linkBalance = await linkToken.balanceOf(messenger.address);
    console.log('Messenger LINK balance:', fromWei(linkBalance));
    const transferAmount = toWei('100');
    await linkToken.transfer(messenger.address, transferAmount);
    linkBalance = await linkToken.balanceOf(messenger.address);
    console.log('New Messenger LINK balance:', fromWei(linkBalance));
    callback(null);
  } catch (error) {
    callback(error);
  }
};
