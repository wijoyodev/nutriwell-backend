import { PDD_NUMBER, PPN_NUMBER } from '../../constants';
import * as productService from '../../services/products';
import { ProductPayload, QueryProduct } from '../../types';
import { queriesMaker } from '../../utils';

const createProduct = async (requestPayload: {
  product_name: string;
  description: string;
  product_images: string;
  price: number;
}) => {
  const priceAfterTax = requestPayload.price + Math.ceil(requestPayload.price * PPN_NUMBER);
  const dataPayload: ProductPayload = {
    ...requestPayload,
    price_after_tax: priceAfterTax,
    product_weight: 200,
  };
  const [result] = await productService.createProduct(dataPayload);
  return result;
};

const updateProduct = async (requestPayload: { [key: string]: string | number }) => {
  const { id, ...rest } = requestPayload;
  rest.price_after_tax = Number(rest.price) + Math.ceil(Number(rest.price) * PPN_NUMBER);
  const keys = Object.keys(rest).map((item) => `${item} = ?`);
  const values = Object.values(rest);
  const dataPayload = {
    keys,
    values,
  };
  if (keys.length > 0) {
    const [result] = await productService.updateProduct(dataPayload, id);
    return result;
  }
  return {
    affectedRows: 0,
  };
};

const selectProduct = async (requestPayload: QueryProduct, methodQuery: string = 'and') => {
  const { queryTemplate, queryValue } = queriesMaker(requestPayload, methodQuery);
  const [result] = await productService.selectProduct(queryTemplate, queryValue);
  if (Array.isArray(result) && result.length > 0) {
    result[0].price = parseFloat(result[0].price);
    result[0].price_after_tax = parseFloat(result[0].price_after_tax);
    result[0].product_images = JSON.parse(result[0].product_images);
    return { data: result, ppn_tax: PPN_NUMBER, pdd_tax: PDD_NUMBER };
  } else return [];
};

export { createProduct, updateProduct, selectProduct };
