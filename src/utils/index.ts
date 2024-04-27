import Logger from '../lib/logger';

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
    default:
      status = source === 'xendit' ? 0 : 2;
      break;
  }
  return { status, message };
};

export const queriesMaker = (
  queriesPayload: { [key: string]: string | number },
  methodQuery: string,
  alias?: string,
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
          .map((item) => `${alias + '.'}${item} = ?`),
        value: Object.values(queries[key]).filter((item) => item),
      };
  }
  let matchQuery = '';
  let andQuery = '';
  let orQuery = '';
  const valueArray: string[][] = [];
  for (const [key, object] of Object.entries(objectQueries)) {
    if (key === 'match') {
      matchQuery += `(MATCH (title, description) AGAINST (?))`;
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
  } else if (andQuery) {
    queryTemplate = `WHERE ${andQuery}`;
    if (orQuery) queryTemplate += ` AND ${orQuery}`;
  } else if (orQuery) queryTemplate = `WHERE ${orQuery}`;
  Logger.info(`condition SQL generated for the process: ${queryTemplate}`);
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
