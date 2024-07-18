import { Request, Response, NextFunction } from 'express';
import * as shipmentApi from '../../api/shipment';
import Logger from '../../lib/logger';
import { QueryShipment, ShipmentPayload } from '../../types';
import { ERROR_NAME } from '../../constants';
import { validationResult } from 'express-validator';
const createShipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Create Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    const { user_id } = req.user;
    const {
      recipient_name,
      recipient_phone_number,
      phone_number_country,
      province,
      city,
      district,
      address_detail,
      postal_code,
    } = req.body;
    const createPayload: ShipmentPayload = {
      user_id: user_id ?? '',
      recipient_name,
      recipient_phone_number,
      phone_number_country,
      province,
      city,
      district,
      address_detail,
      postal_code,
    };
    const result = await shipmentApi.createShipment(createPayload);
    Logger.info(`Create Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(201).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Create Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name || err, message: err.message };
    next(errorPayload);
  }
};

const updateShipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Update Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id } = req.user;
    const updateShipment: ShipmentPayload = {
      ...req.body,
    };
    const result = await shipmentApi.updateShipment({ ...updateShipment, id: user_id ?? '' });
    Logger.info(`Update Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Update Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectShipment = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryShipment>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { id, search } = req.query;
    const result = await shipmentApi.selectShipment({ id, search }, 'and');
    Logger.info(`Select Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectMyShipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Select Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { user_id } = req.user;
    const result = await shipmentApi.selectShipment({ user_id: user_id ?? '' });
    Logger.info(`Select Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select Shipment -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { createShipment, updateShipment, selectShipment, selectMyShipment };
