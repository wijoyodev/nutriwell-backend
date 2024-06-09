import { NextFunction, Response, Request } from 'express';
import Logger from '../../lib/logger';
import { findMyNetwork, findMyNetworkStatus, findNetworkDetail, findNetworks } from '../../api/network';
import { QueryNetwork } from '../../types';

const getNetworkList = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryNetwork>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Get network list -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id, offset, level } = req.query;
    const result = await findNetworks({ user_id: user_id as string, offset: offset ?? '0', level });
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
    Logger.info(`Get network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
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
    Logger.info(`Get my network detail -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
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

const getMyNetworkStat = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryNetwork>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Get my network status -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id } = req.user;
    const { user_id: user_id_query } = req.query;
    const result = await findMyNetworkStatus({ id: user_id_query ?? (user_id || '') });
    Logger.info(`Get my network status -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get my network status -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { getNetworkList, getNetworkDetail, getMyNetworks, getMyNetworkStat };
