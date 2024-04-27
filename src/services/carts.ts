import { execute, query } from '.';
import { CartPayload } from '../types';

const createCart = async (payload: CartPayload) => {
  const { user_id, product_id, quantity, total_weight, total_price } = payload;
  return await execute(
    `
        INSERT INTO carts
        (user_id,product_id,quantity,total_weight,total_price)
        VALUES(?,?,?,?,?)
        ON DUPLICATE KEY UPDATE quantity= ?,total_weight= ?,total_price= ?;
    `,
    [user_id, product_id, quantity, total_weight, total_price, quantity, total_weight, total_price],
  );
};

const selectCart = async (conditionSql?: string, conditionValue?: string[]) => {
  return await execute(
    `SELECT c.*,p.product_name,p.product_images,p.price FROM carts c JOIN products p ON p.id = c.product_id ${conditionSql}`,
    conditionValue,
  );
};

const deleteCart = async (payload: string) => {
  return await query(`DELETE FROM carts WHERE id = ${payload}`);
};

export { createCart, selectCart, deleteCart };
