import { execute } from '.';
import { ProductHistoryPayload, ProductPayload } from '../types';

const createProduct = async (payload: ProductPayload) => {
  const { product_name, description, product_weight, product_images, price, price_after_tax } = payload;
  return await execute(
    `
        INSERT INTO products(product_name,description,product_weight,product_images,price,price_after_tax)
        VALUES(?,?,?,?,?,?)
    `,
    [product_name, description, product_weight, product_images, price, price_after_tax],
  );
};

const createProductHistory = async (payload: ProductHistoryPayload) => {
  const { product_name, cart_id, description, product_weight, product_images, price, price_after_tax, product_id } =
    payload;
  return await execute(
    `
        INSERT INTO product_histories(product_id,cart_id,product_name,description,product_weight,product_images,price,price_after_tax)
        VALUES(?,?,?,?,?,?,?,?)
    `,
    [product_id, cart_id, product_name, description, product_weight, product_images, price, price_after_tax],
  );
};

const selectProduct = async (conditionSql?: string, conditionValue?: string[]) => {
  return await execute(`SELECT * FROM products ${conditionSql}`, conditionValue);
};

const updateProduct = async (payload: { [key: string]: (string | number)[] }, id: string | number) => {
  const { keys, values } = payload;
  return await execute(
    `
    UPDATE products SET ${keys.join(', ')} WHERE id = ${id}
  `,
    values,
  );
};

const queryCreateProductHistory = () => {
  return `
    INSERT INTO product_histories(product_id,cart_id,product_name,description,product_weight,product_images,price,price_after_tax)
    VALUES(?,?,?,?,?,?,?,?)
  `;
};

export { createProduct, createProductHistory, selectProduct, updateProduct, queryCreateProductHistory };
