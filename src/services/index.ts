import mysql, { PoolOptions, ResultSetHeader } from 'mysql2/promise';
import { DB } from '../settings';

const access: PoolOptions = {
  host: DB.DB_HOST,
  user: DB.DB_USER,
  database: DB.DB_DATABASE,
  password: DB.DB_PASSWORD,
  connectionLimit: 10,
  waitForConnections: true,
  timezone: DB.DB_TIMEZONE,
};

const pool = mysql.createPool(access);

const execute = async (sql: string, values?: (string | number | undefined)[]) => {
  const connection = await pool.getConnection();
  const result = await connection.execute<ResultSetHeader>(sql, values);
  connection.release();
  return result;
};

const query = async (sql: string) => {
  const connection = await pool.getConnection();
  const result = await connection.query(sql);
  connection.release();
  return result;
};

export { query, execute };
