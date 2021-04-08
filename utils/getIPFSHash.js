const createClient = require('ipfs-http-client');

const ipfsClient = createClient({
  host: 'ipfs.dsla.network',
  port: 443,
  protocol: 'https',
});

async function getIPFSHash(ipfsData) {
  const dataString = JSON.stringify(ipfsData);
  const buffer = Buffer.from(dataString, 'utf-8');
  const { path: ipfsHash } = await ipfsClient.add(buffer);
  return ipfsHash;
}

export default getIPFSHash;
