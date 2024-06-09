import { ERROR_NAME } from '../../constants';
import * as cartService from '../../services/carts';
import { selectProduct } from '../../services/products';
import { CartPayload, QueryCart } from '../../types';
import { queriesMaker } from '../../utils';

const createCart = async (requestPayload: CartPayload) => {
  const { product_id, quantity } = requestPayload;
  const [productResult] = await selectProduct(`WHERE id = ${product_id}`);
  if (Array.isArray(productResult)) {
    const { product_weight, price } = productResult[0];
    const dataPayload: CartPayload = requestPayload;
    dataPayload.total_price = quantity * Number(price);
    // in grams
    dataPayload.total_weight = quantity * product_weight;
    // default status
    dataPayload.status_cart = 1;
    const [result] = await cartService.createCart(dataPayload);
    return result;
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not find product for calculation.' };
};

const selectCart = async (requestPayload: QueryCart, methodQuery: string = 'and') => {
  const { queryTemplate, queryValue } = queriesMaker(requestPayload, methodQuery, 'c');
  const [result] = await cartService.selectCart(queryTemplate, queryValue);
  if (Array.isArray(result) && result.length > 0) {
    result[0].total_price = parseFloat(result[0].total_price);
    result[0].price = parseFloat(result[0].price);
    result[0].product_images = JSON.parse(result[0].product_images);
    return result;
  } else return [];
};

const updateQuantityCart = async (requestPayload: { [key: string]: number }, id: string) => {
  const { quantity, price, weight } = requestPayload;
  const updatePayload: {
    quantity: number;
    total_price?: number;
    total_weight?: number;
  } = {
    quantity,
    total_price: price * quantity,
    total_weight: weight * quantity,
  };
  const keys = Object.keys(updatePayload).map((item) => `${item} = ?`);
  const values = Object.values(updatePayload);
  const [result] = await cartService.updateQuantityCart(keys, values, id);
  if (result.affectedRows) return result;
  else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not update cart.' };
};

const deleteCart = async (requestPayload: string) => {
  const [result] = await cartService.deleteCart(requestPayload);
  return result;
};

export { createCart, selectCart, deleteCart, updateQuantityCart };
