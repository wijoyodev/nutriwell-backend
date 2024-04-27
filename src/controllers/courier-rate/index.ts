import { Request, Response, NextFunction } from 'express';
import * as rateApi from '../../api/rate';
import Logger from '../../lib/logger';
import { validationResult } from 'express-validator';
import { ERROR_NAME } from '../../constants';

const getRates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Get Courier Rates -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    // const { id, user_id, search } = req.query;
    const { destination_postal_code, items } = req.body;
    const result = await rateApi.getRate({ destination_postal_code, items });
    Logger.info(`Get Courier Rates -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get Courier Rates -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { getRates };
