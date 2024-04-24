import { findNetworkByValue, totalNetworkByValue } from '../../services/networks';

export const findNetwork = async (queryPayload: { [key: string]: string }) => {
  const conditions = [];
  const values = [];
  for (const key in queryPayload) {
    if (key !== 'sort' ?? key !== 'offset') {
      conditions.push(key);
      values.push(queryPayload[key]);
    }
  }
  const [resultFind] = await findNetworkByValue(values, conditions, queryPayload.limit, queryPayload.offset);
  const [countNetwork] = await totalNetworkByValue();
  if (Array.isArray(resultFind) && Array.isArray(countNetwork)) {
    const { total_network } = countNetwork[0];

    return {
      data: resultFind,
      offset: queryPayload.offset ?? '0',
      limit: '10',
      total: total_network,
    };
  }
};
