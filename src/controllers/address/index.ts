import { Request, Response, NextFunction } from 'express';
import * as addressApi from '../../api/address';
import Logger from '../../lib/logger';
import { QueryAddress } from '../../types';

const selectProvince = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Select Province -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const result = await addressApi.selectProvince();
    Logger.info(`Select Province -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(201).json({ result });
  } catch (err) {
    Logger.error(
      `Select Province -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectCity = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryAddress>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select City -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { province_id } = req.query;
    const result = await addressApi.selectCity(province_id ?? '');
    Logger.info(`Select City -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select City -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectDistrict = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryAddress>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select District -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { city_id } = req.query;
    const result = await addressApi.selectDistrict(city_id ?? '');
    Logger.info(`Select District -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select District -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { selectDistrict, selectProvince, selectCity };
