import { TAX_DISBURSEMENT } from '../constants';
import Logger from '../lib/logger';
import { EMAIL_SERVICE } from '../settings';

export const phoneNumberChecker = (phone: string) => {
  if (phone.startsWith('8')) return `0${phone}`;
  if (phone.startsWith('+')) return `0${phone.slice(3)}`;
  return phone;
};

export const referralCodeGenerator = () => Math.random().toString(36).substring(2, 7).toUpperCase();

export const orderGenerator = () => Math.floor(100000000 + Math.random() * 900000000);

export const statusOrderGenerator = (statusCode: string, source: string) => {
  let status = 0;
  let message = '';
  switch (statusCode) {
    case 'PAID':
    case 'SETTLED':
      status = 1;
      break;
    case 'UNPAID':
    case 'PENDING':
      status = 0;
      break;
    case 'EXPIRED':
      status = 4;
      message = 'Payment Expired.';
      break;
    case 'rejected':
    case 'courier_not_found':
    case 'cancelled':
    case 'returned':
    case 'disposed':
      status = 4;
      message = 'Order has been rejected/courier not found/cancelled/returned by biteship.';
      break;
    case 'delivered':
      status = 3;
      break;
    case 'picking_up':
    case 'allocated':
    case 'picked':
    case 'dropping_off':
      status = 2;
      break;
    default:
      status = source === 'xendit' ? 0 : 1;
      break;
  }
  return { status, message };
};

export const queriesMaker = (
  queriesPayload: { [key: string]: string | number | undefined },
  methodQuery = 'and',
  alias?: string,
  matchKey?: string[],
  rangePayload?: { [key: string]: string | number },
  dateType = 'created_at',
) => {
  const andObject = {};
  const matchObject = {};
  const orObject = {};
  // to filter based on and, or, match query
  for (const [key, value] of Object.entries(queriesPayload)) {
    if (value) {
      if (key === 'search') Object.assign(matchObject, { [key]: value });
      else {
        if (methodQuery === 'and') Object.assign(andObject, { [key]: value });
        if (methodQuery === 'or') Object.assign(orObject, { [key]: value });
      }
    }
  }
  const queries: {
    [key: string]: {
      [subkey: string]: string;
    };
  } = { match: matchObject, and: andObject, or: orObject };
  const objectQueries: { [key: string]: { condition: string[]; value: string[] } } = Object.create({});
  for (const key in queries) {
    if (Object.keys(queries[key]).length > 0)
      objectQueries[key] = {
        condition: Object.keys(queries[key])
          .filter((item) => item)
          .map((item) => {
            if (item === 'start' && Object.values(queries[key])) return `${alias ? alias + '.' : ''}${dateType} >= ?`;
            else if (item === 'end' && Object.values(queries[key]))
              return `${alias ? alias + '.' : ''}${dateType} <= ?`;
            else return `${alias ? alias + '.' : ''}${item} = ?`;
          }),
        value: Object.values(queries[key]).filter((item) => item),
      };
  }
  let matchQuery = '';
  let andQuery = '';
  let orQuery = '';
  const valueArray: string[][] = [];
  for (const [key, object] of Object.entries(objectQueries)) {
    if (key === 'match' && matchKey && matchKey?.length > 0) {
      matchQuery += `(MATCH (${matchKey?.map((item) => `${alias ? alias + '.' : ''}${item}`).join(',')}) AGAINST (?))`;
      valueArray.push(object.value);
    } else if (key === 'and') {
      andQuery += `(${object.condition.join(' AND ')})`;
      valueArray.push(object.value);
    } else if (key === 'or') {
      orQuery += `(${object.condition.join(' OR ')})`;
      valueArray.push(object.value);
    }
  }
  const queryValue = valueArray.flat();
  let queryTemplate = '';
  if (matchQuery) {
    queryTemplate = `WHERE ${matchQuery}`;
    if (andQuery) queryTemplate += ` AND ${andQuery}`;
    if (orQuery) queryTemplate += ` AND ${orQuery}`;
    if (rangePayload) queryTemplate += ` AND ${rangePayload.key} IN (${rangePayload.value})`;
  } else if (andQuery) {
    queryTemplate = `WHERE ${andQuery}`;
    if (orQuery) queryTemplate += ` AND ${orQuery}`;
    if (rangePayload) queryTemplate += ` AND ${rangePayload.key} IN (${rangePayload.value})`;
  } else if (orQuery) {
    queryTemplate = `WHERE ${orQuery}`;
    if (rangePayload) queryTemplate += ` AND ${rangePayload.key} IN (${rangePayload.value})`;
  } else if (rangePayload) queryTemplate += `WHERE ${rangePayload.key} IN (${rangePayload.value})`;
  Logger.info(`condition SQL generated for the process: ${JSON.stringify(queryTemplate)}`);
  return { queryTemplate, queryValue };
};

export const apiCall = async <T>(
  api_url: string,
  options: { [key: string]: string | string[] | Headers },
): Promise<T> => {
  Logger.info(`API call to ${api_url}: start`);
  const res = await fetch(api_url, options);
  const result = (await res.json()) as T;
  Logger.info(`API call to ${api_url}: finish`);
  return result;
};

export const emailPayloadGenerator = (template_id: string, bodyEmail: { [key: string]: string }) => {
  return {
    service_id: EMAIL_SERVICE.SERVICE_ID,
    template_id,
    user_id: EMAIL_SERVICE.USER_ID,
    accessToken: EMAIL_SERVICE.ACCESS_TOKEN,
    template_params: bodyEmail,
  };
};

export const rewardComission = (total_price: number, level: string) => {
  let totalReward = 0;
  switch (level) {
    case 'first':
      totalReward = total_price * (9 / 100);
      break;
    case 'second':
      totalReward = total_price * (7 / 100);
      break;
    case 'third':
      totalReward = total_price * (5 / 100);
      break;
    case 'fourth':
      totalReward = total_price * (3 / 100);
      break;
    case 'fifth':
      totalReward = total_price * (2 / 100);
      break;
    default:
      break;
  }

  return totalReward;
};

export const monthBeforeGenerator = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - 1);
  return d.toLocaleString('sv-SE');
};

export const taxDeducter = (amount: number) => {
  let taxToDeduct = 0;
  if (amount > TAX_DISBURSEMENT.under_tax.limit) {
    const remainingAmount = amount - TAX_DISBURSEMENT.under_tax.limit;
    taxToDeduct =
      TAX_DISBURSEMENT.under_tax.limit * TAX_DISBURSEMENT.under_tax.tax +
      remainingAmount * TAX_DISBURSEMENT.upper_tax.tax;
  } else taxToDeduct = amount * TAX_DISBURSEMENT.under_tax.tax;
  const amountToDisburse = amount - taxToDeduct;
  return {
    amountToDisburse,
    taxToDeduct,
  };
};

export const setDeadlineDate = (dayOfDeadline: number) =>
  new Date(new Date().setDate(new Date().getDate() + dayOfDeadline)).toLocaleString('sv-SE');

export const isLastDayOfMonth = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1); // Check the next day
  return tomorrow.getDate() === 1; // If tomorrow is the 1st, today is the last day
};
