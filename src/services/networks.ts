import { execute, query } from '.';

export const findNetworkByValue = async (value: (string | number)[], queries: string, sort = 'DESC', offset = '0') => {
  return await execute(
    `SELECT n.*, s.full_name, s.avatar_url, s.referrer_code, s.referral_code, s.email, s.phone_number, sh.province, re.downlines, 
    JSON_OBJECT('full_name', se.full_name, 'code', se.code, 'join_date', se.created_at, 'phone_number', se.phone_number) AS upline,
    sh.province
    FROM networks n 
    JOIN users s ON s.id=n.user_id 
    LEFT JOIN users se ON se.referral_code=s.referrer_code 
    LEFT OUTER JOIN (SELECT COUNT(networks.user_id) as downlines, networks.upline_id FROM networks LEFT JOIN users ON users.id = networks.upline_id GROUP BY networks.upline_id) re ON re.upline_id = n.user_id
    LEFT JOIN shipments sh ON sh.user_id=n.user_id ${queries} ORDER BY n.level DESC, n.created_at ${sort} LIMIT 10 OFFSET ${offset};`,
    value,
  );
};

export const findNetworkByCode = async (code: string) => {
  return await execute<{ id: number }>(
    `
      SELECT s.id FROM users s WHERE s.referral_code = '${code}'
    `,
  );
};

export const findNetworkDetail = async (value: string[] = []) => {
  return await execute(
    `SELECT n.level, s.created_at, n.user_id, s.avatar_url, s.full_name FROM networks n 
    JOIN users s ON s.id = n.user_id
    WHERE n.user_id= ?
  `,
    value,
  );
};

export const findMyNetwork = async (value: string[] = []) => {
  return await execute(
    `SELECT n.level, s.full_name, s.avatar_url, re.downlines FROM networks n 
    JOIN users s ON s.id = n.user_id
    LEFT OUTER JOIN 
    (SELECT COUNT(networks.user_id) as downlines, networks.upline_id FROM networks LEFT JOIN users ON users.id = networks.upline_id GROUP BY networks.upline_id) re
    ON re.upline_id = n.user_id
    WHERE n.upline_id= ? ORDER BY n.level DESC
  `,
    value,
  );
};

export const totalNetworkByValue = async (value: string[] | number[] = [], queries = '') => {
  return await execute(`SELECT COUNT(n.id) AS total_network FROM networks n ${queries} `, value);
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

export const networkOrderStat = async (value: string[]) => {
  return await execute(
    `
  SELECT ne.level, x.transactions, COUNT(ne.id) as total_network FROM networks ne JOIN users se ON se.id=ne.user_id JOIN
  (SELECT COUNT(n.id) as transactions, one.level FROM networks one LEFT JOIN orders_networks n ON n.network_user_id = one.user_id GROUP BY one.level) x ON x.level=ne.level 
  ${value.length > 0 ? `WHERE ne.upline_id = ?` : ''} GROUP BY ne.level ORDER BY ne.level DESC;
  `,
    value,
  );
};
