import { hexToUtf8 } from 'web3-utils';

const axios = require('axios');

export const getSLI = async (
  slaAddress,
  periodId,
  networkAnalyticsAddress,
) => {
  const {
    data: { data: { result } },
  } = await axios({
    method: 'post',
    url: 'http://localhost:3333/adapter',
    data: {
      id: '1',
      data: {
        job_type: 'staking_efficiency',
        sla_address: slaAddress,
        period_id: periodId,
        network_analytics_address: networkAnalyticsAddress,
      },
    },
    withCredentials: true,
  });
  const [hits, misses] = hexToUtf8(result).split(',').map(Number);
  const efficiency = Math.trunc((hits * 100 * 1000) / (hits + misses));
  return efficiency;
};

export default getSLI;
