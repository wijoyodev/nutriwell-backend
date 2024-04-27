import { Request, Response, NextFunction } from 'express';
import * as productApi from '../../api/product';
import Logger from '../../lib/logger';
import { ProductPayload, QueryProduct } from '../../types';
import { ERROR_NAME } from '../../constants';
import { API_URL } from '../../settings';
import { validationResult } from 'express-validator';
const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Create Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    if (Array.isArray(req.files)) {
      if (req.files.length < 1) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Images are not uploaded.' };
      const product_images = req.files?.map((item: Express.Multer.File) => API_URL + item.path.split('uploads')[1]);
      const createPayload: ProductPayload = {
        product_images: JSON.stringify(product_images),
        product_name: req.body.product_name,
        description: req.body.description,
        price: req.body.price,
      };
      const result = await productApi.createProduct(createPayload);
      Logger.info(`Create Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
      res.status(201).json({ result: { status: result.affectedRows } });
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Error while uploading images.' };
  } catch (err) {
    Logger.error(
      `Create Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Update Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const updateProduct: ProductPayload = {
      ...req.body,
    };
    if (Array.isArray(req.files) && req.files.length > 0) {
      const product_images = req.files.map((item: Express.Multer.File) => API_URL + item.path.split('uploads')[1]);
      updateProduct.product_images = JSON.stringify(product_images);
    }
    const result = await productApi.updateProduct({ ...updateProduct, id: req.params.id });
    Logger.info(`Update Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Update Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectProduct = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryProduct>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { id, search } = req.query;
    const result = await productApi.selectProduct({ id, search }, 'and');
    Logger.info(`Select Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { createProduct, updateProduct, selectProduct };
