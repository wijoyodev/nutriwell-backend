import { execute, query } from '.';
import { UserAdmin } from '../types';

export const createUser = async (payload: { [key: string]: string }) => {
  const { referrer_code } = payload;
  if (referrer_code) {
    await query(`CREATE TRIGGER IF NOT EXISTS add_network AFTER INSERT on users
    FOR EACH ROW
    BEGIN
      INSERT INTO networks (user_id, upline_id, level)
      VALUES(NEW.id,(SELECT id FROM users WHERE referral_code = NEW.referrer_code),'1');
    END;`);
  }
  const keyToAdd = [];
  const valueToAdd = [];
  for (const key in payload) {
    if (payload[key]) {
      keyToAdd.push(key);
      valueToAdd.push(payload[key]);
    }
  }
  return await execute(
    `INSERT INTO users(${keyToAdd.join(',')})
    VALUES(${keyToAdd.map(() => '?').join(',')});
    `,
    valueToAdd,
  );
};

export const createAdmin = async (payload: UserAdmin) => {
  const { full_name, email, password, code, role = 4 } = payload;
  await query(`DROP TRIGGER IF EXISTS add_network;`);
  return await execute(
    `INSERT INTO users(code,role,full_name,email,password) 
      VALUES(?,?,?,?,?);`,
    [code, role, full_name, email, password],
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
    queries = 'WHERE ' + orQueries;
  }

  if (keyAnd.length > 0) {
    const andMapKey = keyAnd.map((item) => `${item} = ?`);
    andQueries += `(${andMapKey.join(' AND ')})`;
    queries = 'WHERE ' + andQueries;
  }

  if (orQueries && andQueries) queries = `WHERE ${andQueries} AND ${orQueries}`;
  return await execute(`SELECT * FROM users ${queries};`, value);
};

export const findUserNetworkList = async (values: string[]) => {
  return await execute(
    `SELECT s.*,JSON_ARRAYAGG(JSON_MERGE_PRESERVE(JSON_OBJECT('user_id', n.user_id), JSON_OBJECT('code', n.code), JSON_OBJECT('name', n.full_name), JSON_OBJECT('referrer_code',n.referral_code))) AS network_list FROM users s JOIN (
    SELECT ne.*, se.full_name, se.code, se.referral_code FROM networks ne JOIN users se ON se.id=ne.user_id
    ) n WHERE s.id = ${values[0]}`,
  );
};

export const findSelf = async (userId: string) => {
  return await query(`
    SELECT s.*, ne.my_networks, JSON_ARRAYAGG(JSON_MERGE_PRESERVE(JSON_OBJECT('level', r.level),JSON_OBJECT('total_network', r.total_network))) AS network_list FROM users s JOIN (SELECT n.level, COUNT(n.user_id) total_network FROM networks n GROUP BY n.level) r 
    JOIN (SELECT t.upline_id, COUNT(t.user_id) AS my_networks FROM networks t GROUP BY t.upline_id) ne WHERE s.id = ${userId} AND ne.upline_id = ${userId};
  `);
};

export const updateUser = async (key: string[], condition: string[], value: string[] | number[]) => {
  const updateQueries = key.map((item) => `${item} = ?`);
  const whereQueries = condition.map((item) => `${item} = ?`);
  return await execute(`UPDATE users SET ${updateQueries.join(', ')} WHERE ${whereQueries.join(' AND ')}`, value);
};
