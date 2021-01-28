import { getIndexerAPIUrl } from '../../environments';

const axios = require('axios');

const getQueryString = async (slaAddress, slaMonitoringStart, slaMonitorinEnd) => (
  `${await getIndexerAPIUrl()}/params?query=%7B%0A%20%20getSLI%28%0A%20%20%20%20sla_address%3A%20%22${
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
    data: { sliData },
  } = await axios({ method: 'get', url: queryString });
  const [hits, misses] = sliData.split(',').map(Number);
  const efficiency = Math.trunc((hits * 100 * 1000) / (hits + misses));
  return efficiency;
};

export default getSLI;
