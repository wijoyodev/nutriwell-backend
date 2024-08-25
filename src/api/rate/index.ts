import { CACHE_KEY } from '../../constants';
import { generateCache, getCache } from '../../lib/cache';
import Logger from '../../lib/logger';
import { BITESHIP_URL, BITESHIP_API_KEY } from '../../settings';
import { RateResponse } from '../../types';
import { apiCall } from '../../utils';

const getRate = async (requestPayload: {
  destination_postal_code: number;
  items: { name: string; weight: number; price: number; quantity: number }[];
}) => {
  const cacheData = getCache(CACHE_KEY.rates);
  if (!cacheData) {
    const { destination_postal_code, items } = requestPayload;
    const dataPayload = {
      destination_postal_code,
      origin_postal_code: 16112,
      couriers: 'anteraja,jne,sicepat,tiki,jnt,idexpress',
      items,
    };

    const headers = [
      ['Content-Type', 'application/json'],
      ['authorization', BITESHIP_API_KEY],
    ];

    const apiOptions = {
      method: 'POST',
      body: JSON.stringify(dataPayload),
      headers: new Headers(headers),
    };
    const getResponse = await apiCall<RateResponse>(`${BITESHIP_URL}/v1/rates/couriers`, apiOptions);
    if (getResponse) {
      if (getResponse.error) {
        Logger.error(`Biteship Rate API: ${JSON.stringify(getResponse.error)}`);
        return [];
      } else {
        const saveCache = generateCache(CACHE_KEY.rates, getResponse.pricing, 1200);
        if (!saveCache) Logger.error(`Cache: Set cache with key ${CACHE_KEY.rates} failed`);
        return getResponse.pricing;
      }
    } else {
      Logger.error(`Cannot reach biteship for retrieving courier rates.`);
      return [];
    }
  } else {
    Logger.info(`Cache: Generate courier rates with cache`);
    return cacheData;
  }
};

export { getRate };
