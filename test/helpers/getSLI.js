const https = require('https');

const httpPromise = (url) => new Promise((resolve, reject) => {
  https
    .get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        resolve(JSON.parse(data));
      });
    })
    .on('error', (err) => {
      reject(err.message);
    });
});

const getQueryString = (slaAddress, slaMonitoringStart, slaMonitorinEnd) => (
  `https://dsla.network/api?query=%7B%0A%20%20getSLI%28%0A%20%20%20%20sla_address%3A%20%22${
    slaAddress
  }%22%0A%20%20%20%20sla_monitoring_start%3A%20%22${
    slaMonitoringStart
  }%22%0A%20%20%20%20sla_monitoring_end%3A%20%22${
    slaMonitorinEnd
  }%22%0A%20%20%29%0A%7D%0A`
);
// Test parameters
// const address = "0xf7cdda73b01Bd3A3D306C30f3825B5FB607d1946";
// const slaMonitoringStart = 1577836800000000000;
// const slaMonitoringEnd = 1594026520000000000;

export const getSLI = async (
  slaAddress,
  slaMonitoringStart,
  slaMonitoringEnd,
) => {
  const queryString = getQueryString(
    slaAddress,
    slaMonitoringStart,
    slaMonitoringEnd,
  );
  const {
    data: { getSLI: response },
  } = await httpPromise(queryString);
  return response;
};

export default getSLI;
