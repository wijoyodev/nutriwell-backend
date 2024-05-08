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
    const [result] = await cartService.createCart(dataPayload);
    return result;
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not find product for calculation.' };
};

const selectCart = async (requestPayload: QueryCart, methodQuery: string = 'and') => {
  const { queryTemplate, queryValue } = queriesMaker(requestPayload, methodQuery);
  const [result] = await cartService.selectCart(queryTemplate, queryValue);
  if (Array.isArray(result) && result.length > 0) {
    result[0].total_price = parseFloat(result[0].total_price);
    result[0].price = parseFloat(result[0].price);
    result[0].product_images = JSON.parse(result[0].product_images);
    return result;
  } else return [];
};

const deleteCart = async (requestPayload: string) => {
  const [result] = await cartService.deleteCart(requestPayload);
  return result;
};

export { createCart, selectCart, deleteCart };
