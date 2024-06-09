import { NextFunction, Response, Request } from 'express';
import Logger from '../../lib/logger';
import * as disbursementApi from '../../api/disbursement';
import { ERROR_NAME } from '../../constants';
import { XENDIT_WEBHOOK_TOKEN } from '../../settings';
import { QueryDisbursement } from '../../types';

const createDisbursement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Create Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id } = req.user;
    const {
      amount,
      account_bank_code,
      account_bank_name,
      account_bank_number,
      description = 'Penarikan Reward',
    } = req.body;
    if (user_id) {
      const result = await disbursementApi.createDisbursement({
        user_id,
        amount,
        account_bank_code,
        account_bank_name,
        account_bank_number,
        description,
      });
      Logger.info(`Create Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
      res.status(200).json({ result });
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'User Id is not found to continue disbursement process.' };
  } catch (err) {
    Logger.error(
      `Create Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const updateDisbursement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Update Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    // check for token headers, token xendit and biteship are the same
    if (req.headers['x-callback-token']) {
      if (req.headers['x-callback-token'] !== XENDIT_WEBHOOK_TOKEN)
        throw { name: ERROR_NAME.ACCESS_DENIED, message: 'Webhook with invalid token' };
      else if (Object.keys(req.body).length > 1) {
        const { id, status, updated, failure_code } = req.body;
        const result = await disbursementApi.updateDisbursement({
          id,
          status,
          updated,
          failure_code,
        });
        Logger.info(`Update Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
        res.status(200).json({ result });
      }
    } else res.status(200).json({ result: { status: 0 } });
  } catch (err) {
    Logger.error(
      `Update Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getDisbursement = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryDisbursement>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Get Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id, status, offset, id } = req.query;
    const result = await disbursementApi.getDisbursementList({
      id: id ?? '',
      user_id: user_id ?? '',
      status: status?.split(','),
      offset,
    });
    Logger.info(`Get Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get Disbursement -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const listBank = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Get List Bank -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const result = await disbursementApi.listBank();
    Logger.info(`Get List Bank -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get List Bank -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { updateDisbursement, createDisbursement, getDisbursement, listBank };
