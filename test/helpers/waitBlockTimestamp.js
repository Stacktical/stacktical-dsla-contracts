import Web3 from 'web3';
import { envParameters } from '../../environments';

const waitBlockTimestamp = async (timestamp) => new Promise((resolve, reject) => {
  console.log(timestamp);
  const web3Subscription = new Web3(envParameters.web3WebsocketProviderUrl);
  web3Subscription.eth.subscribe('newBlockHeaders', (error, result) => {
    if (error) {
      reject(error);
    }
    const { timestamp: blockTimestamp } = result;
    console.log(blockTimestamp);
    if (timestamp < blockTimestamp) {
      resolve(result);
      web3Subscription.eth.clearSubscriptions();
    }
  });
});

export default waitBlockTimestamp;
