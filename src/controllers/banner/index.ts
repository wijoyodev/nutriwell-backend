import { Request, Response, NextFunction } from 'express';
import * as bannerApi from '../../api/banner';
import Logger from '../../lib/logger';
import { QueryBanner } from '../../types';
import { DOMAIN, ERROR_NAME } from '../../constants';
import { validationResult } from 'express-validator';

const createBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Create Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    if (!req.file) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Image is not uploaded.' };
    const createPayload = {
      image_url: DOMAIN + req.file?.path.split('uploads')[1],
      title: req.body.title,
      description: req.body.description,
    };
    const result = await bannerApi.createBanner(createPayload);
    Logger.info(`Create Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(201).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Create Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const updateBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Update Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    if (!req.body.title) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Title must be in payload.' };
    if (!req.body.description) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Description must be in payload.' };

    const result = await bannerApi.updateBanner({ ...req.body, id: req.params.id });
    Logger.info(`Update Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Create Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectBanner = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryBanner>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { id, code, search } = req.query;
    const result = await bannerApi.selectBanner({ id, code, search }, 'and');
    Logger.info(`Select Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const deleteBanner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Delete Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const result = await bannerApi.deleteBanner(req.params.id);
    Logger.info(`Delete Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Delete Banner -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { createBanner, updateBanner, selectBanner, deleteBanner };
