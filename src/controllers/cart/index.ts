import { Request, Response, NextFunction } from 'express';
import * as cartApi from '../../api/cart';
import Logger from '../../lib/logger';
import { CartPayload, QueryCart } from '../../types';
import { ERROR_NAME } from '../../constants';
import { validationResult } from 'express-validator';
const createCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Upsert Cart -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    const { user_id } = req.user;
    const createPayload: CartPayload = {
      user_id: user_id ?? '',
      product_id: req.body.product_id,
      quantity: req.body.quantity,
    };
    const result = await cartApi.createCart(createPayload);
    Logger.info(`Upsert Cart -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(201).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Upsert Cart -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectCart = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryCart>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select Product -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { id, user_id, search } = req.query;
    const { user_id: user_id_mid } = req.user;
    const result = await cartApi.selectCart({ id, user_id: user_id ?? user_id_mid, search }, 'and');
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

const deleteCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Delete Cart -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const result = await cartApi.deleteCart(req.params.id);
    Logger.info(`Delete Cart -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Delete Cart -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { createCart, selectCart, deleteCart };
