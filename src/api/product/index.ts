import * as productService from '../../services/product';
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
  return result;
};

export { createProduct, updateProduct, selectProduct };
