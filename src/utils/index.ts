import Logger from '../lib/logger';

export const phoneNumberChecker = (phone: string) => {
  if (phone.startsWith('8')) return `0${phone}`;
  if (phone.startsWith('+')) return `0${phone.slice(3)}`;
  return phone;
};

export const referralCodeGenerator = () => Math.random().toString(36).substring(2, 7).toUpperCase();

export const identityGenerator = (role: string) => {
  let userId = 'UN';
  switch (role) {
    case '1':
    case '2':
    case '3':
      userId = 'AD';
      break;
    case '4':
      userId = 'CU';
      break;
    case '5':
      userId = 'DI';
      break;
    case '6':
      userId = 'BA';
      break;
    default:
      break;
  }
  return userId;
};

export const queriesMaker = (queriesPayload: { [key: string]: string | number }, methodQuery: string) => {
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
          .map((item) => `${item} = ?`),
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
