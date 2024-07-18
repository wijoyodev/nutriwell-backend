import { ERROR_NAME, PDD_NUMBER, PPN_NUMBER } from '../../constants';
import * as cartService from '../../services/carts';
import { selectProduct } from '../../services/products';
import { CartPayload, QueryCart } from '../../types';
import { queriesMaker } from '../../utils';

const createCart = async (requestPayload: CartPayload) => {
  const { product_id, quantity } = requestPayload;
  const [productResult] = await selectProduct(`WHERE id = ${product_id}`);
  if (Array.isArray(productResult)) {
    const { product_weight, price, price_after_tax } = productResult[0];
    const dataPayload: CartPayload = requestPayload;
    dataPayload.total_price = quantity * Number(price);
    dataPayload.total_price_after_tax = quantity * price_after_tax;
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
    result.map((item) => {
      item.total_price = parseFloat(item.total_price);
      item.total_price_after_tax = parseFloat(item.total_price_after_tax);
      item.price = parseFloat(item.price);
      item.product_images = JSON.parse(item.product_images);
    });
    return { data: result, ppn_tax: PPN_NUMBER, pdd_tax: PDD_NUMBER };
  } else return [];
};

const updateQuantityCart = async (requestPayload: { [key: string]: number }, id: string) => {
  const { quantity, price, weight, price_after_tax } = requestPayload;
  const updatePayload: {
    quantity: number;
    total_price?: number;
    total_weight?: number;
    total_price_after_tax?: number;
  } = {
    quantity,
    total_price: price * quantity,
    total_weight: weight * quantity,
    total_price_after_tax: price_after_tax * quantity,
  };
  let keys = Object.keys(updatePayload).map((item) => `${item} = ?`);
  let values = Object.values(updatePayload);
  if (!quantity) {
    keys = ['status_cart = ?'];
    values = [quantity];
  }
  const [result] = await cartService.updateQuantityCart(keys, values, id);
  if (result.affectedRows) return result;
  else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not update cart.' };
};

const deleteCart = async (requestPayload: string) => {
  const [result] = await cartService.deleteCart(requestPayload);
  return result;
};

export { createCart, selectCart, deleteCart, updateQuantityCart };
