import Logger from '../../lib/logger';
import { BITESHIP_URL, BITESHIP_API_KEY } from '../../settings';
import { RateResponse } from '../../types';
import { apiCall } from '../../utils';

const getRate = async (requestPayload: {
  destination_postal_code: number;
  items: { name: string; weight: number; price: number; quantity: number }[];
}) => {
  const { destination_postal_code, items } = requestPayload;
  const dataPayload = {
    destination_postal_code,
    origin_postal_code: 16112,
    couriers: 'anteraja,jne,sicepat,tiki',
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
    } else return getResponse.pricing;
  }
};

export { getRate };
