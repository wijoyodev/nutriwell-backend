import { NextFunction, Response, Request } from 'express';
import Logger from '../../lib/logger';
import { findNetwork } from '../../api/network';
import { QueryNetwork } from '../../types';

const getNetworkList = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryNetwork>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Get network list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const queries = req.query;
    const resultNetwork = await findNetwork(queries);
    Logger.info(`Get network list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json(resultNetwork);
  } catch (err) {
    Logger.error(
      `Get network list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    next(err);
  }
};

export { getNetworkList };
