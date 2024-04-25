import { execute } from '.';
import { ProductPayload } from '../types';

const createProduct = async (payload: ProductPayload) => {
  const { product_name, description, product_weight, product_images, price } = payload;
  return await execute(
    `
        INSERT INTO products(product_name,description,product_weight,product_images,price)
        VALUES(?,?,?,?,?)
    `,
    [product_name, description, product_weight, product_images, price],
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

export { createProduct, selectProduct, updateProduct };
