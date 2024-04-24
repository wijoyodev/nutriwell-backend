import { execute, query } from '.';

export const findNetworkByValue = async (
  value: string[] | number[],
  keyAnd: string[],
  sort = 'DESC',
  offset = '0',
  keyOr: string[] = [],
) => {
  let orQueries = '';
  let andQueries = '';
  let queries = '';
  if (keyOr.length > 0) {
    const orMapKey = keyOr.map((item) => `${item} = ?`);
    orQueries += `(${orMapKey.map((item) => `n.${item}`).join(' OR ')})`;
    queries = 'WHERE ' + orQueries;
  }

  if (keyAnd.length > 0) {
    const andMapKey = keyAnd.map((item) => `${item} = ?`);
    andQueries += `(${andMapKey.map((item) => `n.${item}`).join(' AND ')})`;
    queries = 'WHERE ' + andQueries;
  }

  if (orQueries && andQueries) queries = `WHERE ${andQueries} AND ${orQueries}`;
  return await execute(
    `SELECT n.*, s.full_name, s.avatar_url, s.referrer_code, s.referral_code, s.email, s.phone_number FROM networks n JOIN users s ON s.id=n.user_id ${queries} ORDER BY n.level DESC, n.created_at ${sort} LIMIT 10 OFFSET ${offset};`,
    value,
  );
};

export const findNetworkByCode = async (code: string) => {
  return await execute(
    `
      SELECT s.id FROM users s WHERE s.referral_code = '${code}'
    `,
  );
};

export const totalNetworkByValue = async (
  value: string[] | number[] = [],
  keyAnd: string[] = [],
  keyOr: string[] = [],
) => {
  let orQueries = '';
  let andQueries = '';
  let queries = '';
  if (keyOr.length > 0) {
    const orMapKey = keyOr.map((item) => `${item} = ?`);
    orQueries += `(${orMapKey.join(' OR ')})`;
    queries = 'WHERE ' + orQueries;
  }

  if (keyAnd.length > 0) {
    const andMapKey = keyAnd.map((item) => `${item} = ?`);
    andQueries += `(${andMapKey.join(' AND ')})`;
    queries = 'WHERE ' + andQueries;
  }

  if (orQueries && andQueries) queries = `WHERE ${andQueries} AND ${orQueries}`;
  return await execute(`SELECT COUNT(id) AS total_network FROM networks ${queries}`, value);
};

export const updateNetworkLevel = async (userId: string) => {
  return await query(`
  UPDATE networks n
  INNER JOIN (SELECT t.upline_id,COUNT(t.user_id) as total_user FROM networks t GROUP BY t.upline_id) AS r
  SET n.level = CASE 
    WHEN r.total_user >= POWER(2,n.level) AND r.total_user < POWER(2,n.level + 1) THEN n.level + 1
    WHEN r.total_user >= POWER(2,n.level - 1) AND r.total_user < POWER(2,n.level) THEN n.level
    WHEN n.level < 2 THEN n.level
    ELSE n.level - 1
  END
  WHERE n.user_id = ${userId} AND r.upline_id = ${userId};
  `);
};
