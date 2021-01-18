import { getIndexerAPIUrl } from '../../environments.config';

const https = require('https');

const httpsPromise = (url) => new Promise((resolve, reject) => {
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

const getQueryString = async (slaAddress, slaMonitoringStart, slaMonitorinEnd) => (
  `${await getIndexerAPIUrl()}?query=%7B%0A%20%20getSLI%28%0A%20%20%20%20sla_address%3A%20%22${
    slaAddress
  }%22%0A%20%20%20%20sla_monitoring_start%3A%20%22${
    slaMonitoringStart
  }%22%0A%20%20%20%20sla_monitoring_end%3A%20%22${
    slaMonitorinEnd
  }%22%0A%20%20%29%0A%7D%0A`
);

export const getSLI = async (
  slaAddress,
  slaMonitoringStart,
  slaMonitoringEnd,
) => {
  const queryString = await getQueryString(
    slaAddress,
    slaMonitoringStart,
    slaMonitoringEnd,
  );
  const {
    data: { getSLI: response },
  } = await httpsPromise(queryString);
  return response;
};

export default getSLI;
