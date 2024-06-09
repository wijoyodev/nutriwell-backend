import { execute, query } from '.';
import { CartPayload } from '../types';

const createCart = async (payload: CartPayload) => {
  const { user_id, product_id, quantity, total_weight, total_price, status_cart } = payload;
  return await execute(
    `
        INSERT INTO carts
        (user_id,product_id,quantity,total_weight,total_price,status_cart)
        VALUES(?,?,?,?,?,?);
    `,
    [user_id, product_id, quantity, total_weight, total_price, status_cart],
  );
};

const selectCart = async (conditionSql?: string, conditionValue?: string[]) => {
  return await execute(
    `SELECT c.*,p.product_name,p.product_images,p.price,p.product_weight FROM carts c JOIN products p ON p.id = c.product_id ${conditionSql}`,
    conditionValue,
  );
};

const selectCartPrice = async (value: string) => {
  return await execute(
    `
    SELECT carts.total_price FROM carts WHERE id = ?
  `,
    [value],
  );
};

const updateQuantityCart = async (payloadKey: string[], payloadValue: (string | number)[], keyId: string) => {
  return await execute(`UPDATE carts SET ${payloadKey.join(',')} WHERE id = ${keyId}`, payloadValue);
};

const updateStatusCart = async (payload: number[]) => {
  return await execute(`UPDATE carts SET status_cart = ? WHERE id = ?`, payload);
};

const deleteCart = async (payload: string) => {
  return await query(`DELETE FROM carts WHERE id = ${payload}`);
};

export { createCart, selectCart, deleteCart, updateQuantityCart, updateStatusCart, selectCartPrice };
