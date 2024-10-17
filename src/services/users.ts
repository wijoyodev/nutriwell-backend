import { execute, query } from '.';
import { LEVEL_NAME } from '../constants';
import { UserAdmin } from '../types';

export const createUser = async (keyToAdd: string[], valueToAdd: (string | number)[], referrerExists = true) => {
  if (referrerExists) {
    await query(`CREATE TRIGGER IF NOT EXISTS add_network AFTER INSERT on users
    FOR EACH ROW
    BEGIN
      INSERT INTO networks (user_id, upline_first_id, upline_second_id, upline_third_id, upline_fourth_id, upline_fifth_id)
      VALUES(
        NEW.id,
        (SELECT id FROM users WHERE referral_code = NEW.referrer_code),
        (SELECT n.upline_first_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code),
        (SELECT n.upline_second_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code),
        (SELECT n.upline_third_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code),
        (SELECT n.upline_fourth_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code)
      );
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
    `SELECT s.id, s.full_name, s.code, s.status, s.email, s.referral_code, s.phone_number, s.gender, s.date_of_birth, s.account_bank, s.account_bank_code,
    s.account_bank_name, s.account_bank_number, s.avatar_url, s.role, s.referrer_code,
    JSON_OBJECT('avatar_url', se.avatar_url, 'full_name', se.full_name, 'code', se.code, 'join_date', se.created_at, 'phone_number', se.phone_number) AS upline
    FROM users s 
    LEFT JOIN users se ON se.referral_code=s.referrer_code
    ${conditionSql} ORDER BY s.created_at ${sort} LIMIT 10 OFFSET ${offset};`,
    conditionValue,
  );
};

export const findUserWithPassword = async (
  conditionSql: string,
  conditionValue?: string[],
  offset = '0',
  sort = 'DESC',
) => {
  return await execute(
    `SELECT s.id, s.full_name, s.password, s.code, s.status, s.email, s.referral_code, s.phone_number, s.gender, s.date_of_birth, s.account_bank, s.account_bank_code,
    s.account_bank_name, s.account_bank_number, s.avatar_url, s.role, s.referrer_code,
    JSON_OBJECT('avatar_url', se.avatar_url, 'full_name', se.full_name, 'code', se.code, 'join_date', se.created_at, 'phone_number', se.phone_number) AS upline
    FROM users s 
    LEFT JOIN users se ON se.referral_code=s.referrer_code
    ${conditionSql} ORDER BY s.created_at ${sort} LIMIT 10 OFFSET ${offset};`,
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
    SELECT s.id, s.full_name, s.code, s.status, s.email, s.referral_code, s.phone_number, s.gender, s.date_of_birth, s.account_bank, s.account_bank_code, s.account_bank_name, s.account_bank_number, s.avatar_url,
    (SELECT COUNT(nd.id) as total_network FROM networks nd WHERE nd.upline_first_id = s.id OR nd.upline_second_id = s.id OR nd.upline_third_id = s.id OR nd.upline_fourth_id = s.id OR nd.upline_fifth_id = s.id) as total_downlines,
    (SELECT FORMAT(SUM(reward_profit),0) as total_reward FROM rewards WHERE rewards.user_id=s.id) as total_profit,
    JSON_OBJECT('full_name', se.full_name, 'code', se.code, 'join_date', se.created_at, 'phone_number', se.phone_number) AS upline, 
    JSON_OBJECT('address_detail', sh.address_detail, 'recipient_name', sh.recipient_name, 'recipient_phone_number', sh.recipient_phone_number, 
    'province', sh.province, 'postal_code', sh.postal_code, 'city', sh.city, 'district', sh.district) AS address_detail
    FROM users s LEFT JOIN users se ON se.referral_code=s.referrer_code 
    LEFT JOIN shipments sh ON sh.user_id=s.id
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

export const queryFindUser = (conditionSql: string) => {
  return `SELECT s.id FROM users s ${conditionSql}`;
};

export const queryFindUserByReferral = () => {
  return `SELECT s.id FROM users s WHERE referral_code = ?;`;
};

export const queryCountDownlines = (currentLevel: number) =>
  `SELECT COUNT(n.id) as count FROM networks n WHERE n.upline_${LEVEL_NAME[currentLevel]}_id = ?;`;

export const queryListDownlines = (currentLevel: number) =>
  `SELECT n.user_id, s.referral_code FROM networks n JOIN users s ON s.id=n.user_id WHERE n.upline_${LEVEL_NAME[currentLevel]}_id = ? ORDER BY n.created_at ASC;`;

export const queryTriggerNewDownline = () => `CREATE TRIGGER IF NOT EXISTS add_network AFTER INSERT on users
    FOR EACH ROW
    BEGIN
      INSERT INTO networks (user_id, upline_first_id, upline_second_id, upline_third_id, upline_fourth_id, upline_fifth_id)
      VALUES(
        NEW.id,
        (SELECT id FROM users WHERE referral_code = NEW.referrer_code),
        (SELECT n.upline_first_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code),
        (SELECT n.upline_second_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code),
        (SELECT n.upline_third_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code),
        (SELECT n.upline_fourth_id FROM networks n JOIN users u ON n.user_id = u.id WHERE u.referral_code = NEW.referrer_code)
      );
    END;`;

export const queryCreateUser = (keyToAdd: string[]) => `INSERT INTO users(${keyToAdd.join(',')})
  VALUES(${keyToAdd.map(() => '?').join(',')});
  `;

export const queryUpdateUserStatus = (userMap: string[]) =>
  `UPDATE users SET status = ? WHERE id IN (${userMap.join(',')})`;

export const queryGetUserStatus = () => `SELECT s.id, s.status FROM users s LIMIT ? OFFSET ?;`;
