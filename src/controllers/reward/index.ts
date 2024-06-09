import { NextFunction, Response, Request } from 'express';
import Logger from '../../lib/logger';
import * as rewardApi from '../../api/reward';
import { QueryRewards } from '../../types';

const getRewards = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryRewards>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Get reward list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id, offset } = req.query;
    const { user_id: user_id_mid } = req.user;
    const result = await rewardApi.getRewards(offset, user_id ? user_id : user_id_mid || '');
    Logger.info(`Get reward list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get reward list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { getRewards };
