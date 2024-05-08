import { execute } from '.';

const createOrder = async (key: string, value: (string | number)[]) => {
  return await execute(
    `INSERT INTO orders(${key})
    VALUES(${value.map(() => '?').join(',')});
    `,
    value,
  );
};

const selectOrderById = async (conditionValue?: string[], keyId = 'id') => {
  return await execute(
    `SELECT orders.*,
    JSON_OBJECT('code', users.code, 'full_name', users.full_name, 'email', users.email, 'phone_number', users.phone_number, 
    'address_detail', shipments.address_detail, 'account_bank', users.account_bank, 'account_bank_name', users.account_bank_name, 'account_bank_number', users.account_bank_number, 'recipient_name', shipments.recipient_name, 'recipient_phone_number', shipments.recipient_phone_number, 'province', shipments.province, 'postal_code', shipments.postal_code, 'city', shipments.city, 'district', shipments.district, 'subdistrict', shipments.subdistrict) AS user_detail,
    JSON_OBJECT('product_name', products.product_name, 'product_image', products.product_images, 'price', products.price, 'quantity', carts.quantity, 'total_price', carts.total_price, 'total_weight', carts.total_weight) AS product_detail
    FROM orders JOIN (users,carts,shipments,products) ON (carts.product_id = products.id AND orders.user_id=users.id AND orders.cart_id=carts.id AND orders.address_shipment_id = shipments.id) WHERE orders.${keyId} = ?`,
    conditionValue,
  );
};

const selectOrders = async (queries: string, value: string[] | number[], sort = 'DESC', offset = '0') => {
  return await execute(
    `SELECT orders.*, JSON_OBJECT('code', users.code, 'full_name', users.full_name, 'email', users.email, 'phone_number', users.phone_number) AS user_detail,
    JSON_OBJECT('product_name', products.product_name, 'product_image', products.product_images, 'price', products.price, 'quantity', carts.quantity, 'total_price', carts.total_price) AS product_detail
    FROM orders JOIN (carts, products, users) ON (carts.product_id=products.id AND orders.cart_id=carts.id AND orders.user_id=users.id) ${queries} ORDER BY orders.created_at ${sort} LIMIT 10 OFFSET ${offset};`,
    value,
  );
};

const findTotalOrders = async (conditionSql: string, conditionValue?: string[]) => {
  return await execute(`SELECT COUNT(id) AS total_orders FROM orders ${conditionSql}`, conditionValue);
};

const selectOrderDetails = async (conditionValue: number[]) => {
  return await execute(
    `
    SELECT carts.*,JSON_OBJECT('full_name', users.full_name, 'email', users.email, 'recipient_name', shipments.recipient_name, 'recipient_phone_number', shipments.recipient_phone_number, 'address_detail', 
    CONCAT(shipments.address_detail,shipments.subdistrict,shipments.district,shipments.city,shipments.province), 'postal_code', shipments.postal_code) AS user_detail,
    JSON_OBJECT('product_name', products.product_name, 'product_image', products.product_images, 'price', products.price) AS product_detail FROM carts 
    JOIN (shipments,products,users) ON (carts.user_id=users.id AND carts.product_id=products.id AND carts.user_id=shipments.user_id)
    WHERE carts.id = ? AND shipments.id = ?;
  `,
    conditionValue,
  );
};

const updateOrder = async (payload: { [key: string]: (string | number)[] }, keyId: string, id: string | number) => {
  const { keys, values } = payload;
  // order can be updated:
  /**
   * 1. status
   * 2. payment_date
   * 3. payment_method
   * 4. shipment_number
   * 5. reasons
   * 6. delivery_date
   * 7. receive_date
   * 8. external_id
   * 9. estimated_delivery_date
   */
  return await execute(
    `
    UPDATE orders SET ${keys.join(', ')} WHERE ${keyId} = ${keyId === 'id' ? id : "'" + id + "'"}
  `,
    values,
  );
};

export { createOrder, selectOrderById, selectOrders, selectOrderDetails, updateOrder, findTotalOrders };
