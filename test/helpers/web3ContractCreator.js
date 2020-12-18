import { testEnv } from "../../environments.config";
const Web3 = require("web3");

// create an instance to listen for events using websockets
export const web3ContractCreator = (abi, address) => {
  try {
    const web3 = new Web3(
      new Web3.providers.WebsocketProvider(testEnv.web3WebsocketProviderUrl)
    );
    return new web3.eth.Contract(abi, address);
  } catch (error) {
    console.log(error);
    throw new Error(error.message);
  }
};
