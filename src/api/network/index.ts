import * as networkService from '../../services/networks';
import { queriesMaker } from '../../utils';

export const findNetwork = async (queryPayload: { [key: string]: string }) => {
  let totalNetwork = 0;
  let network_references;
  const { sort, offset, ...rest } = queryPayload;
  const { queryTemplate, queryValue } = queriesMaker(rest, 'and', 'n');
  const [resultFind] = await networkService.findNetworkByValue(queryValue, queryTemplate, sort, offset);
  const [countNetwork] = await networkService.totalNetworkByValue(queryValue, queryTemplate);
  if (queryPayload.upline_id) {
    const [resultNetwork] = await networkService.networkOrderStat([queryPayload.upline_id]);
    network_references = resultNetwork;
  }

  if (Array.isArray(resultFind) && Array.isArray(countNetwork)) {
    const { total_network } = countNetwork[0];
    totalNetwork = total_network;
  }
  return {
    data: resultFind,
    network_references,
    offset: Number(queryPayload.offset) || 0,
    limit: 10,
    total: totalNetwork,
  };
};

export const findNetworkDetail = async (queryPayload: string) => {
  const [result] = await networkService.findNetworkDetail([queryPayload]);
  const [resultNetwork] = await networkService.networkOrderStat([queryPayload]);
  const network_references = resultNetwork;
  return {
    data: result,
    network_references,
  };
};

export const findMyNetwork = async (queryPayload: string) => {
  let total_network = 0;
  const [result] = await networkService.findMyNetwork([queryPayload]);
  const [resultNetwork] = await networkService.networkOrderStat([queryPayload]);
  if (Array.isArray(resultNetwork)) {
    total_network = resultNetwork.reduce((acc, currentValue) => {
      return acc + currentValue.total_network;
    }, 0);
  }
  return {
    data: result,
    total_network,
  };
};
