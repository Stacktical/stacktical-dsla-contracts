import { getEnvFromNodeEnv } from '../environments';

const { ContractFactory } = require('@harmony-js/contract');
const { Wallet } = require('@harmony-js/account');
const { Messenger, WSProvider } = require('@harmony-js/network');
const { ChainID, ChainType } = require('@harmony-js/utils');

const Web3 = require('web3');

const contractCreator = (contract) => {
  const envParameters = getEnvFromNodeEnv();
  const { abi, address } = contract;
  try {
    if (/harmony/i.test(process.env.NODE_ENV)) {
      const ws = new WSProvider(envParameters.web3WebsocketProviderUrl);
      const wallet = new Wallet(
        new Messenger(
          ws,
          ChainType.Harmony,
          // /mainnet/i.test(process.env.NODE_ENV) ? ChainID.HmyMainnet : ChainID.HmyTestnet,
          ChainID.HmyTestnet,
        ),
      );
      const factory = new ContractFactory(wallet);
      return factory.createContract(abi, address);
    }
    const web3 = new Web3(
      new Web3.providers.WebsocketProvider(envParameters.web3WebsocketProviderUrl),
    );
    return new web3.eth.Contract(abi, address);
  } catch (error) {
    console.log(error);
  }
};

// returns the second half of values, since the first half is only the position
// of the value. e.g. {0:'hola','message':hola}
const filterEventValues = (values) => {
  const valuesCount = Object.keys(values).length;
  const splicedEntries = Object.entries(values).slice(valuesCount / 2, valuesCount);
  return splicedEntries.reduce((r, [k, v]) => Object.assign(r, { [k]: v }), {});
};

// event listener
const eventListener = async (contract, event) => {
  const web3Contract = contractCreator(contract);
  return new Promise((resolve, reject) => {
    web3Contract.events[event](
      {
        fromBlock: 'latest',
      },
      // eslint-disable-next-line consistent-return
      (error, result) => {
        if (error) {
          return reject(error);
        }
        const { event: name, returnValues: values } = result;
        const response = { name, values: filterEventValues(values) };
        return resolve(response);
      },
    );
  });
};

export default eventListener;
