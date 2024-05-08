import { Request, Response, NextFunction } from 'express';
import * as orderApi from '../../api/order';
import Logger from '../../lib/logger';
import { QueryOrders } from '../../types';
import { ERROR_NAME } from '../../constants';
import { validationResult } from 'express-validator';
import { XENDIT_WEBHOOK_TOKEN } from '../../settings';
import { statusOrderGenerator } from '../../utils';
const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Create Order -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    const { user_id } = req.user;
    if (!user_id) throw { name: ERROR_NAME.ACCESS_DENIED, message: 'No user id found from middleware.' };
    const {
      cart_id,
      address_shipment_id,
      courier_name,
      courier_service_name,
      courier_rate,
      courier_type,
      courier_company,
      total_purchase,
      shipment_duration_range,
    } = req.body;
    const createPayload = {
      user_id,
      cart_id,
      address_shipment_id,
      courier_name,
      courier_service_name,
      courier_rate,
      courier_type,
      courier_company,
      total_purchase,
      shipment_duration_range,
    };
    const result = await orderApi.createOrder(createPayload);
    Logger.info(`Create Order -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(201).json({ result: { status: result?.affectedRows, invoice_url: result?.invoice_url } });
  } catch (err) {
    Logger.error(
      `Create Order -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name || err, message: err.message };
    next(errorPayload);
  }
};

const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Update Order -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const updateOrder = {
      ...req.body,
    };
    const result = await orderApi.updateOrder({ ...updateOrder, id: req.params.id });
    Logger.info(`Update Order -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result: { status: result.affectedRows } });
  } catch (err) {
    Logger.error(
      `Update Order -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const updateOrderWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Update Order Via Webhook -client ${JSON.stringify(req.client)}-: start`);
    // check for token headers, token xendit and biteship are the same
    if (req.headers['x-callback-token']) {
      if (req.headers['x-callback-token'] !== XENDIT_WEBHOOK_TOKEN)
        throw { name: ERROR_NAME.ACCESS_DENIED, message: 'Webhook with invalid token' };
      else if (Object.keys(req.body).length > 1) {
        // adjust payload to update orders
        const updatePayload: {
          status?: number;
          payment_method?: string;
          payment_date?: string;
          reasons?: string;
          external_id?: string;
          shipment_number?: string;
          delivery_date?: string;
          receive_date?: string;
        } = {};
        const { status, payment_method, external_id, order_id, courier_waybill_id } = req.body;
        const { status: statusGenerated, message } = statusOrderGenerator(
          status,
          payment_method ? 'xendit' : 'biteship',
        );
        updatePayload.status = status ? statusGenerated : undefined;
        updatePayload.reasons = message;
        updatePayload.external_id = order_id;
        updatePayload.payment_method = payment_method;
        updatePayload.payment_date =
          status === 'PAID' || status === 'SETTLED' ? new Date().toLocaleString() : undefined;
        updatePayload.shipment_number = courier_waybill_id;
        updatePayload.delivery_date = status === 'allocated' ? new Date().toLocaleString() : undefined;
        updatePayload.receive_date = status === 'delivered' ? new Date().toLocaleString() : undefined;
        const result = await orderApi.updateOrder(
          { ...updatePayload, id: external_id ?? order_id },
          external_id ? 'order_number' : 'external_id',
        );
        Logger.info(`Update Order Via Webhook -client ${JSON.stringify(req.client)}-: finish`);
        res.status(200).json({ result: { status: result.affectedRows } });
      } else res.status(200).json({ result: { status: 0 } });
    }
  } catch (err) {
    Logger.error(`Update Order Via Webhook -client ${JSON.stringify(req.client)}-: ${JSON.stringify(err)}`);
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectOrders = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryOrders>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select orders -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { id, status, search, sort, offset } = req.query;
    const result = await orderApi.selectOrders({ id, status, search, sort, offset }, 'and');
    Logger.info(`Select orders -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select orders -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectMyOrders = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryOrders>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Select orders -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { sort, offset } = req.query;
    const { user_id } = req.user;
    const result = await orderApi.selectOrders({ user_id: user_id ?? '', sort, offset }, 'and');
    Logger.info(`Select orders -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select orders -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getTracking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Get Tracking data -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { external_id } = req.params;
    const result = await orderApi.getTracking(external_id);
    Logger.info(`Get Tracking data -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Get Tracking data -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const selectOrderById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Select order by id -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const { id } = req.params;
    const result = await orderApi.selectOrderById(id);
    Logger.info(`Select order by id -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Select orders by id -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

export { createOrder, updateOrder, selectOrders, selectOrderById, getTracking, updateOrderWebhook, selectMyOrders };
