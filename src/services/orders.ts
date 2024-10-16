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
    'address_detail', shipments.address_detail, 'account_bank', users.account_bank, 'account_bank_code', users.account_bank_code, 'account_bank_name', users.account_bank_name, 'account_bank_number', users.account_bank_number, 'recipient_name', shipments.recipient_name, 'recipient_phone_number', shipments.recipient_phone_number, 'province', shipments.province, 'postal_code', shipments.postal_code, 'city', shipments.city, 'district', shipments.district) AS user_detail,
    JSON_OBJECT('product_name', product_histories.product_name, 'product_weight', product_histories.product_weight, 'product_image', product_histories.product_images, 'price', product_histories.price, 'price_after_tax', product_histories.price_after_tax, 'quantity', carts.quantity, 'total_price_after_tax', carts.total_price_after_tax, 'total_price', carts.total_price, 'total_weight', carts.total_weight) AS product_detail
    FROM orders JOIN (users,carts,shipments,product_histories) ON (orders.user_id=users.id AND orders.cart_id=carts.id AND orders.address_shipment_id = shipments.id AND carts.id = product_histories.cart_id) WHERE orders.${keyId} = ?`,
    conditionValue,
  );
};

const selectOrders = async (queries: string, value: string[] | number[], sort = 'DESC', offset = '0') => {
  return await execute(
    `SELECT orders.*, JSON_OBJECT('code', users.code, 'full_name', users.full_name, 'email', users.email, 'phone_number', users.phone_number) AS user_detail,
    JSON_OBJECT('product_name', product_histories.product_name, 'product_image', product_histories.product_images, 'price', product_histories.price, 'price_after_tax', product_histories.price_after_tax, 'quantity', carts.quantity, 'total_price', carts.total_price, 'total_price_after_tax', carts.total_price_after_tax) AS product_detail,
    carts.total_price as net_income
    FROM orders JOIN (carts, product_histories, users) ON (carts.id=product_histories.cart_id AND orders.cart_id=carts.id AND orders.user_id=users.id) ${queries} ORDER BY orders.created_at ${sort} LIMIT 10 OFFSET ${offset};`,
    value,
  );
};

const findTotalOrders = async (conditionSql: string, conditionValue?: string[]) => {
  return await execute(
    `SELECT COUNT(orders.id) AS total_orders, SUM(carts.total_price) as total_net_income, SUM(carts.total_price_after_tax) as total_net_income_after_tax FROM orders JOIN (carts, product_histories, users) ON (carts.id=product_histories.cart_id AND orders.cart_id=carts.id AND orders.user_id=users.id) ${conditionSql}`,
    conditionValue,
  );
};

const selectOrderDetails = async (conditionValue: number[]) => {
  return await execute(
    `
    SELECT carts.*,JSON_OBJECT('full_name', users.full_name, 'email', users.email, 'recipient_name', shipments.recipient_name, 'recipient_phone_number', shipments.recipient_phone_number, 'address_detail', 
    CONCAT(shipments.address_detail,shipments.district,shipments.city,shipments.province), 'postal_code', shipments.postal_code) AS user_detail,
    JSON_OBJECT('product_id', products.id, 'description', products.description, 'product_name', products.product_name, 'product_weight', products.product_weight, 'product_images', products.product_images, 'price', products.price, 'price_after_tax', products.price_after_tax) AS product_detail FROM carts 
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

const queryOrderDetails = () => {
  return `
    SELECT carts.*,JSON_OBJECT('full_name', users.full_name, 'email', users.email, 'recipient_name', shipments.recipient_name, 'recipient_phone_number', shipments.recipient_phone_number, 'address_detail', 
    CONCAT(shipments.address_detail,shipments.district,shipments.city,shipments.province), 'postal_code', shipments.postal_code) AS user_detail,
    JSON_OBJECT('product_id', products.id, 'description', products.description, 'product_name', products.product_name, 'product_weight', products.product_weight, 'product_images', products.product_images, 'price', products.price, 'price_after_tax', products.price_after_tax) AS product_detail FROM carts 
    JOIN (shipments,products,users) ON (carts.user_id=users.id AND carts.product_id=products.id AND carts.user_id=shipments.user_id)
    WHERE carts.id = ? AND shipments.id = ?
  `
}

const queryCreateOrder = (key: string, value: (string | number)[]) => {
  return `
    INSERT INTO orders(${key})
    VALUES(${value.map(() => '?').join(',')});
  `
}

const querySelectOrderById = (keyId = 'id') => {
  return `SELECT orders.*,
    JSON_OBJECT('code', users.code, 'full_name', users.full_name, 'email', users.email, 'phone_number', users.phone_number, 
    'address_detail', shipments.address_detail, 'account_bank', users.account_bank, 'account_bank_code', users.account_bank_code, 'account_bank_name', users.account_bank_name, 'account_bank_number', users.account_bank_number, 'recipient_name', shipments.recipient_name, 'recipient_phone_number', shipments.recipient_phone_number, 'province', shipments.province, 'postal_code', shipments.postal_code, 'city', shipments.city, 'district', shipments.district) AS user_detail,
    JSON_OBJECT('product_name', product_histories.product_name, 'product_weight', product_histories.product_weight, 'product_image', product_histories.product_images, 'price', product_histories.price, 'price_after_tax', product_histories.price_after_tax, 'quantity', carts.quantity, 'total_price_after_tax', carts.total_price_after_tax, 'total_price', carts.total_price, 'total_weight', carts.total_weight) AS product_detail
    FROM orders JOIN (users,carts,shipments,product_histories) ON (orders.user_id=users.id AND orders.cart_id=carts.id AND orders.address_shipment_id = shipments.id AND carts.id = product_histories.cart_id) WHERE orders.${keyId} = ?`
}

const queryUpdateOrder = (payload: { [key: string]: (string | number)[] }, keyId: string, id: string | number) => {
  const { keys, values } = payload;
  return `
    UPDATE orders SET ${keys.join(', ')} WHERE ${keyId} = ${keyId === 'id' ? id : "'" + id + "'"}
  `
}

export { createOrder, selectOrderById, selectOrders, selectOrderDetails, updateOrder, findTotalOrders, queryOrderDetails, queryCreateOrder, querySelectOrderById, queryUpdateOrder };
