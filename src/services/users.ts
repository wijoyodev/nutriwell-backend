import { execute } from '.';
import { User } from '../types';

export const createUser = async (payload: User) => {
  const {
    full_name,
    email,
    password,
    phone_number,
    date_of_birth,
    gender,
    referral_code,
    referrer_code,
    phone_number_country,
    avatar_url,
    code,
    role = 4,
  } = payload;
  return await execute(
    `INSERT INTO users(code,role,full_name,email,password,phone_number,date_of_birth,gender,referral_code,referrer_code,phone_number_country,avatar_url) 
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?);`,
    [
      code,
      role,
      full_name,
      email,
      password,
      phone_number,
      date_of_birth,
      gender,
      referral_code,
      referrer_code,
      phone_number_country,
      avatar_url,
    ],
  );
};

export const getUserMaxValue = async () => {
  return await execute(`SELECT COUNT(id) AS total FROM users`);
};

export const findUserByValue = async (value: string[] | number[], keyAnd: string[], keyOr: string[] = []) => {
  let orQueries = '';
  let andQueries = '';
  let queries = '';
  if (keyOr.length > 0) {
    const orMapKey = keyOr.map((item) => `${item} = ?`);
    orQueries += `(${orMapKey.join(' OR ')})`;
    queries = orQueries;
  }

  if (keyAnd.length > 0) {
    const andMapKey = keyAnd.map((item) => `${item} = ?`);
    andQueries += `(${andMapKey.join(' AND ')})`;
    queries = andQueries;
  }

  if (orQueries && andQueries) queries = `${andQueries} AND ${orQueries}`;
  return await execute(`SELECT * FROM users WHERE ${queries};`, value);
};

export const updateUser = async (key: string[], condition: string[], value: string[] | number[]) => {
  const updateQueries = key.map((item) => `${item} = ?`);
  const whereQueries = condition.map((item) => `${item} = ?`);
  return await execute(`UPDATE users SET ${updateQueries.join(', ')} WHERE ${whereQueries.join(' AND ')}`, value);
};
