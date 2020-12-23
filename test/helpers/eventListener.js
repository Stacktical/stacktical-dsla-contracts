import { testEnv } from "../../environments.config";
const Web3 = require("web3");

const contractCreator = (contract) => {
  const { abi, address } = contract;
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

// event listener
export const eventListener = async (contract, event) => {
  const web3Contract = contractCreator(contract);
  return new Promise((resolve, reject) => {
    web3Contract.once(
      event,
      {
        fromBlock: "latest",
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      }
    );
  });
};
