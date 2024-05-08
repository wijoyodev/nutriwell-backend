import { NextFunction, Response, Request } from 'express';
import Logger from '../../lib/logger';
import { findMyNetwork, findNetwork, findNetworkDetail } from '../../api/network';
import { QueryNetwork } from '../../types';

const getNetworkList = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryNetwork>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Get network list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const queries = req.query;
    const result = await findNetwork(queries);
    Logger.info(`Get network list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get network list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getNetworkDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Get network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { id } = req.params;
    const result = await findNetworkDetail(id);
    Logger.info(`Get network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getMyNetworks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Get my network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id } = req.user;
    const result = await findMyNetwork(user_id ?? '');
    Logger.info(`Get my network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get my network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { getNetworkList, getNetworkDetail, getMyNetworks };
