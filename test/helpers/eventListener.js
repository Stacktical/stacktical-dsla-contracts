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

const filterEventValues = (values) => {
  const valuesCount = Object.keys(values).length;
  const splicedEntries = Object.entries(values).slice(
    valuesCount / 2,
    valuesCount
  );
  return splicedEntries.reduce((r, [k, v]) => {
    return Object.assign(r, { [k]: v });
  }, {});
};

// event listener
export const eventListener = async (contract, event) => {
  const web3Contract = contractCreator(contract);
  return new Promise((resolve, reject) => {
    web3Contract.events.allEvents(
      {
        fromBlock: "latest",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        const { event: name, returnValues: values } = result;
        const response = { name, values: filterEventValues(values) };
        if (process.env.NODE_ENV === "test") {
          console.log(response);
        }
        if (result.event === event) {
          return resolve(response);
        }
      }
    );
    // .on("data", () => (error, result) => {
    //   if (error) return reject(error);
    //   return resolve(result);
    // });
  });
};
