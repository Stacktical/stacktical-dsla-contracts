const bDSLAToken = artifacts.require("bDSLAToken");
const SLA = artifacts.require("SLA");

const DSLA_TOKEN_ADDRESS = "0x653157C7B46A81F106Ae0990E9B23DBFEAA0145F";
const SLA_ADDRESS = "0x5eCC797AC3Acaa4352681C6B461E44672151cC5d";

module.exports = async (callback) => {
  const [owner] = await web3.eth.getAccounts();
  console.log("Owner address is: " + owner);
  const token = await bDSLAToken.at(DSLA_TOKEN_ADDRESS);
  const sla = await SLA.at(SLA_ADDRESS);
  const slaOwner = await sla.owner.call();
  console.log("SLA Owner address is: " + slaOwner);
  if (slaOwner !== owner) {
    callback("Owner and SLA Owner are different");
  }
  await sla.addAllowedTokens(token.address);
  callback(null);
};
