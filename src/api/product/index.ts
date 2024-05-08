import * as productService from '../../services/products';
import { ProductPayload, QueryProduct } from '../../types';
import { queriesMaker } from '../../utils';

const createProduct = async (requestPayload: {
  product_name: string;
  description: string;
  product_images: string;
  price: number;
}) => {
  const dataPayload: ProductPayload = { ...requestPayload, product_weight: 200 };
  const [result] = await productService.createProduct(dataPayload);
  return result;
};

const updateProduct = async (requestPayload: { [key: string]: string | number }) => {
  const { id, ...rest } = requestPayload;
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
    result[0].product_images = JSON.parse(result[0].product_images);
    return result;
  } else return [];
};

export { createProduct, updateProduct, selectProduct };
