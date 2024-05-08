import { execute, query } from '.';
import { UserAdmin } from '../types';

export const createUser = async (keyToAdd: string[], valueToAdd: (string | number)[], referrerExists = true) => {
  if (referrerExists) {
    await query(`CREATE TRIGGER IF NOT EXISTS add_network AFTER INSERT on users
    FOR EACH ROW
    BEGIN
      INSERT INTO networks (user_id, upline_id, level)
      VALUES(NEW.id,(SELECT id FROM users WHERE referral_code = NEW.referrer_code),'1');
    END;`);
  }

  return await execute(
    `INSERT INTO users(${keyToAdd.join(',')})
    VALUES(${keyToAdd.map(() => '?').join(',')});
    `,
    valueToAdd,
  );
};

export const createAdmin = async (payload: UserAdmin) => {
  const { full_name, email, password, status = 1, role = 3 } = payload;
  await query(`DROP TRIGGER IF EXISTS add_network;`);
  return await execute(
    `INSERT INTO users(role,full_name,email,password,status) 
      VALUES(?,?,?,?,?);`,
    [role, full_name, email, password, status],
  );
};

export const getUserMaxValue = async () => {
  return await execute(`SELECT COUNT(id) AS total FROM users`);
};

export const findUserByValue = async (conditionSql: string, conditionValue?: string[], offset = '0', sort = 'DESC') => {
  return await execute(
    `SELECT s.id, s.full_name, s.code, s.status, s.email, s.referral_code, s.phone_number, s.gender, s.date_of_birth, s.account_bank,
    s.account_bank_name, s.account_bank_number, s.avatar_url, s.role, s.referrer_code 
    FROM users s ${conditionSql} ORDER BY s.created_at ${sort} LIMIT 10 OFFSET ${offset};`,
    conditionValue,
  );
};

export const findUserByRefreshToken = async (refreshToken: string) => {
  return await execute(`SELECT * FROM users WHERE reset_password_token = ?`, [refreshToken]);
};

export const findUserByEmail = async (user_account: string) => {
  return await execute(`SELECT * FROM users WHERE email = ? OR phone_number = ?`, [user_account, user_account]);
};

export const findUserAdmin = async (conditionSql: string, conditionValue?: string[], offset = '0', sort = 'DESC') => {
  return await execute(
    `SELECT s.id, s.code, s.full_name, s.email, s.status, ro.name as role_name FROM users s 
    JOIN roles ro ON ro.id=s.role ${conditionSql} ORDER BY s.created_at ${sort} LIMIT 10 OFFSET ${offset}`,
    conditionValue,
  );
};

export const findUserNetworkList = async (
  conditionSql: string,
  conditionValue?: string[],
  offset = '0',
  sort = 'DESC',
) => {
  return await execute(
    `
  SELECT s.id, s.full_name, s.code, s.status, s.referral_code, s.phone_number, s.gender, s.date_of_birth, s.account_bank, s.account_bank_name, s.account_bank_number, s.avatar_url,
  re.downlines, JSON_OBJECT('full_name', se.full_name, 'code', se.code, 'join_date', se.created_at, 'phone_number', se.phone_number) AS upline, 
  JSON_OBJECT('address_detail', sh.address_detail, 'recipient_name', sh.recipient_name, 'recipient_phone_number', sh.recipient_phone_number, 
  'province', sh.province, 'postal_code', sh.postal_code, 'city', sh.city, 'district', sh.district, 'subdistrict', sh.subdistrict) AS address_detail
  FROM users s LEFT JOIN users se ON se.referral_code=s.referrer_code 
  LEFT JOIN shipments sh ON sh.user_id=s.id
  LEFT OUTER JOIN (SELECT COUNT(networks.user_id) as downlines, networks.upline_id FROM networks LEFT JOIN users ON users.id = networks.upline_id 
  GROUP BY networks.upline_id) re ON re.upline_id = s.id
  ${conditionSql}
  ORDER BY s.created_at ${sort} LIMIT 10 OFFSET ${offset};
  `,
    conditionValue,
  );
};

export const findTotalUser = async (conditionSql: string, conditionValue?: string[]) => {
  return await execute(`SELECT COUNT(id) AS total_users FROM users s ${conditionSql}`, conditionValue);
};

export const updateUser = async (key: string[], condition: string[], value: string[] | number[]) => {
  const updateQueries = key.map((item) => `${item} = ?`);
  const whereQueries = condition.map((item) => `${item} = ?`);
  return await execute(`UPDATE users SET ${updateQueries.join(', ')} WHERE ${whereQueries.join(' AND ')}`, value);
};
