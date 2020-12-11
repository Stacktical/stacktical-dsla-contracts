// event listener
export const eventListener = async (contract, event) => {
  return new Promise((resolve, reject) => {
    contract.once(
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
