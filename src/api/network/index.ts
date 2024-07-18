import * as networkService from '../../services/networks';
import { queriesMaker } from '../../utils';

export const findNetwork = async (queryPayload: { [key: string]: string }) => {
  let totalNetwork = 0;
  let network_references;
  const { sort, offset, ...rest } = queryPayload;
  const { queryTemplate, queryValue } = queriesMaker(rest, 'and', 'n');
  const [resultFind] = await networkService.findNetworkByValue(queryValue, queryTemplate, sort, offset);
  const [countNetwork] = await networkService.totalNetworkByValue(queryValue, queryTemplate);
  // if (queryPayload.upline_id) {
  //   const [resultNetwork] = await networkService.networkOrderStat([queryPayload.upline_id]);
  //   network_references = resultNetwork;
  // }

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
  // const [resultNetwork] = await networkService.networkOrderStat([queryPayload]);
  // const network_references = resultNetwork;
  return {
    data: result,
    // network_references,
  };
};

export const findMyNetwork = async (queryPayload: string) => {
  // let total_network = 0;
  const [result] = await networkService.findMyNetwork([queryPayload]);
  // const [resultNetwork] = await networkService.networkOrderStat([queryPayload]);
  // if (Array.isArray(resultNetwork)) {
  //   total_network = resultNetwork.reduce((acc, currentValue) => {
  //     return acc + currentValue.total_network;
  //   }, 0);
  // }
  return {
    data: result,
    // total_network,
  };
};

export const findMyNetworkStatus = async (queryPayload: { id: string }) => {
  const { id } = queryPayload;
  const levelData: {
    upline_first_id?: string;
    upline_second_id?: string;
    upline_third_id?: string;
    upline_fourth_id?: string;
    upline_fifth_id?: string;
  } = {
    upline_first_id: id,
    upline_second_id: id,
    upline_third_id: id,
    upline_fourth_id: id,
    upline_fifth_id: id,
  };
  const [result] = await networkService.findTotalDownlinePerNetwork(String(id));
  const { queryTemplate, queryValue } = queriesMaker(levelData, 'or', 'nd');
  const [resultTotal] = await networkService.findNetworkTotalById(queryTemplate, queryValue);
  if (Array.isArray(result) && Array.isArray(resultTotal)) {
    result.map((item) => {
      item.sum_transaction = parseFloat(item.sum_transaction);
    });
    return {
      totalStat: result,
      totalNetwork: resultTotal,
    };
  }
  return {};
};

export const findNetworks = async (queryPayload: { user_id: string; offset: string; level?: string }) => {
  const { user_id, offset, level } = queryPayload;
  let levelQueries = `nd.upline_first_id = ${user_id} OR nd.upline_second_id = ${user_id} OR nd.upline_third_id = ${user_id} OR nd.upline_fourth_id = ${user_id} OR nd.upline_fifth_id = ${user_id}`;
  if (level) {
    switch (level) {
      case '1':
        levelQueries = `nd.upline_first_id = ${user_id}`;
        break;
      case '2':
        levelQueries = `nd.upline_second_id = ${user_id}`;
        break;
      case '3':
        levelQueries = `nd.upline_third_id = ${user_id}`;
        break;
      case '4':
        levelQueries = `nd.upline_fourth_id = ${user_id}`;
        break;
      case '5':
        levelQueries = `nd.upline_fifth_id = ${user_id}`;
        break;
      default:
        break;
    }
  }

  const [result] = await networkService.listNetworks(user_id, levelQueries, offset);
  const [resultTotal] = await networkService.findNetworkTotalById(`WHERE ${levelQueries}`, []);
  if (Array.isArray(result) && Array.isArray(resultTotal)) {
    return {
      data: result.flat(),
      offset: Number(offset) ?? 0,
      limit: 10,
      ...resultTotal[0],
    };
  }
  return [];
};
