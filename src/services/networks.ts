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

export const findDownlineNetworks = async (user_id: string) => {
  return await execute<{ id: number }>(
    `
      SELECT s.id as referrer_id, s.referral_code, n.* FROM users s JOIN networks n 
      ON n.upline_first_id = s.id OR n.upline_second_id = s.id OR n.upline_third_id = s.id OR n.upline_fourth_id = s.id OR n.upline_fifth_id = s.id
      WHERE s.id = '${user_id}'
      ORDER BY n.created_at ASC;
    `,
  );
};

export const findNetworkDetail = async (value: string[] = []) => {
  return await execute(
    `SELECT n.level, s.created_at, n.user_id, n.upline_id, s.avatar_url, s.full_name FROM networks n 
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

export const findNetworkTotalById = async (queries: string, values: string[]) => {
  return await execute(
    `
  SELECT COUNT(nd.id) as total_network FROM networks nd ${queries};
  `,
    values,
  );
};

export const findOrderTotalByNetwork = async (queries: string, values: string[]) => {
  return await execute(
    `
    SELECT COUNT(o.id) as count_transaction FROM networks nd LEFT JOIN orders o ON o.user_id = nd.user_id ${queries} GROUP BY nd.user_id;
    `,
    values,
  );
};

export const findTotalDownlinePerNetwork = async (user_id: string) => {
  return await query(
    `SELECT s.full_name, s.avatar_url, s.created_at, o.sum_transaction, nd.level_1, nd.total_transaction AS level_1_transaction, ne.level_2, ne.total_transaction AS level_2_transaction, nf.level_3, nf.total_transaction AS level_3_transaction, ng.level_4, ng.total_transaction AS level_4_transaction, nh.level_5, nh.total_transaction AS level_5_transaction FROM networks n 
    LEFT JOIN(SELECT COUNT(user_id) as level_1, COUNT(IF(has_transaction = 1, 1, NULL)) as total_transaction, upline_first_id FROM networks GROUP BY upline_first_id) nd ON nd.upline_first_id=n.user_id
    LEFT JOIN(SELECT COUNT(user_id) as level_2, COUNT(IF(has_transaction = 1, 1, NULL)) as total_transaction, upline_second_id FROM networks GROUP BY upline_second_id) ne ON ne.upline_second_id=n.user_id
    LEFT JOIN(SELECT COUNT(user_id) as level_3, COUNT(IF(has_transaction = 1, 1, NULL)) as total_transaction, upline_third_id FROM networks GROUP BY upline_third_id) nf ON nf.upline_third_id = n.user_id
    LEFT JOIN(SELECT COUNT(user_id) as level_4, COUNT(IF(has_transaction = 1, 1, NULL)) as total_transaction, upline_fourth_id FROM networks GROUP BY upline_fourth_id) ng ON ng.upline_fourth_id = n.user_id
    LEFT JOIN(SELECT COUNT(user_id) as level_5, COUNT(IF(has_transaction = 1, 1, NULL)) as total_transaction, upline_fifth_id FROM networks GROUP BY upline_fifth_id) nh ON nh.upline_fifth_id = n.user_id
    LEFT JOIN(SELECT SUM(total_purchase - courier_rate) AS sum_transaction, user_id FROM orders WHERE user_id = ${user_id}) o ON o.user_id = n.user_id
    LEFT JOIN users s ON s.id = n.user_id
    WHERE n.user_id = ${user_id};`,
  );
};

export const updateHasTransaction = async (values: string[]) => {
  return await execute(
    `
      UPDATE networks 
      SET has_transaction = ?
      WHERE user_id = ?;
    `,
    values,
  );
};

export const findNetworkById = async (values: string[]) => {
  return await execute(
    `
      SELECT * FROM networks WHERE user_id = ?
    `,
    values,
  );
};

export const listNetworks = async (queries: string, levelQueries: string, offset = '0') => {
  return await query(
    `
      SELECT s.full_name, s.avatar_url, s.referrer_code, s.referral_code, s.email, s.phone_number, s.created_at as join_date, se.city, nd.*, 
      JSON_OBJECT('full_name', sr.full_name, 'code', sr.code, 'join_date', sr.created_at, 'phone_number', sr.phone_number) AS upline,
      (SELECT COUNT(nd.id) as total_network FROM networks nd WHERE nd.upline_first_id = s.id OR nd.upline_second_id = s.id OR nd.upline_third_id = s.id OR nd.upline_fourth_id = s.id OR nd.upline_fifth_id = s.id) as total_downlines,
      IF(nd.upline_fifth_id IS NOT NULL AND nd.upline_fifth_id = ${queries}, 5, 
      IF(nd.upline_fourth_id IS NOT NULL AND nd.upline_fourth_id = ${queries}, 4, 
      IF(nd.upline_third_id IS NOT NULL AND nd.upline_third_id = ${queries}, 3, 
      IF(nd.upline_second_id IS NOT NULL AND nd.upline_second_id = ${queries}, 2, 
      IF(nd.upline_first_id IS NOT NULL AND nd.upline_first_id = ${queries}, 1, 0))))) AS level 
      FROM users s 
      LEFT JOIN users sr ON sr.referral_code=s.referrer_code 
      JOIN networks nd ON s.id=nd.user_id LEFT JOIN shipments se ON se.user_id=s.id WHERE ${levelQueries}
      ORDER BY level LIMIT 10 OFFSET ${offset};
      `,
  );
};

export const queryUpdateTransactionStatus = () => {
  return `
      UPDATE networks 
      SET has_transaction = ?
      WHERE user_id = ?;
    `;
};

export const queryFindNetworkById = () => {
  return `
      SELECT * FROM networks WHERE user_id = ?
    `;
};
