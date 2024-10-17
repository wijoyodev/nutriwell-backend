import { execute } from '.';

export const createSession = async (access_token: string, refresh_token: string | undefined, user_id: number) => {
  return await execute(
    `
        INSERT INTO sessions (access_token, refresh_token, user_id)
        VALUES(?,?,?);
    `,
    [access_token, refresh_token, user_id],
  );
};

export const deleteSession = async (user_id: number, refresh_token: string) => {
  return await execute(`DELETE FROM sessions WHERE user_id = ? AND refresh_token = ?;`, [user_id, refresh_token]);
};

export const bulkDeleteSession = async () => {
  return await execute(`DELETE FROM sessions WHERE DATEDIFF(NOW(), created_at) > 30;`);
};

export const updateSession = async (access_token: string, refresh_token: string) => {
  return await execute(
    `
        UPDATE sessions
        SET access_token = ?
        WHERE refresh_token = ?;
      `,
    [access_token, refresh_token],
  );
};

export const findSession = async (access_token: string) => {
  return await execute(`SELECT * FROM sessions WHERE access_token = ?`, [access_token]);
};

export const queryCreateSession = () => `
    INSERT INTO sessions (access_token, refresh_token, user_id)
    VALUES(?,?,?);
  `;
