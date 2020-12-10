const Web3 = require("web3");

const isKovan = process.env.TEST_ENV === "kovan";

export const testEnv = {
  chainlinkOracleAddress: isKovan
    ? "0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e"
    : "0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e",
  web3ProviderUrl: isKovan
    ? "wss://kovan.infura.io/ws/v3/7f08670daac04cec82d4efb8feb1ea29"
    : "ws://localhost:8545",
  chainlinkTokenAddress: isKovan
    ? "0xa36085F69e2889c224210F603D836748e7dC0088"
    : "0xa36085F69e2889c224210F603D836748e7dC0088",
};

// create an instance to listen for events using websockets
export const web3ContractCreator = (abi, address) => {
  const web3 = new Web3(
    new Web3.providers.WebsocketProvider(testEnv.web3ProviderUrl)
  );
  return new web3.eth.Contract(abi, address);
};

// event listener
export const eventListener = async (contract, event) => {
  return new Promise((resolve, reject) => {
    contract.once(
      event,
      {
        fromBlock: "latest",
      },
      (error, result) => {
        resolve(result);
      }
    );
  });
};
