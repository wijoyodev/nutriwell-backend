import { ERROR_NAME } from '../../constants';
import Logger from '../../lib/logger';
import * as orderService from '../../services/orders';
import { API_URL, BITESHIP_HEADER, BITESHIP_URL, XENDIT_HEADER, XENDIT_URL } from '../../settings';
import { OrderPayload, QueryOrders } from '../../types';
import { apiCall, orderGenerator } from '../../utils';
import { queriesMaker } from '../../utils';

const createOrder = async (requestPayload: {
  user_id: number;
  cart_id: number;
  address_shipment_id: number;
  courier_type: string;
  courier_company: string;
  courier_name: string;
  courier_service_name: string;
  courier_rate: number;
  total_purchase: number;
}) => {
  const {
    user_id,
    cart_id,
    address_shipment_id,
    courier_name,
    courier_service_name,
    courier_rate,
    total_purchase,
    courier_company,
    courier_type,
  } = requestPayload;
  const dataPayload: OrderPayload = {
    user_id,
    cart_id,
    address_shipment_id,
    courier_company,
    courier_type,
    courier_name,
    courier_service_name,
    courier_rate,
    total_purchase,
    code: '',
    order_number: String(orderGenerator()),
    status: 0,
  };

  // get address detail and product detail
  const [orderDetails] = await orderService.selectOrderDetails([dataPayload.cart_id, dataPayload.address_shipment_id]);
  if (Array.isArray(orderDetails) && orderDetails.length > 0) {
    const { user_detail } = orderDetails[0];

    const paymentPayload = {
      external_id: dataPayload.order_number,
      amount: dataPayload.total_purchase,
      customer: {
        given_names: user_detail.full_name,
        email: user_detail.email,
        addresses: [
          {
            country: 'Indonesia',
            city: user_detail.city,
            postal_code: user_detail.postal_code,
          },
        ],
      },
      customer_notification_preference: {
        invoice_created: ['email'],
        invoice_reminder: ['email'],
        invoice_paid: ['email'],
      },
      success_redirect_url: API_URL,
      failure_redirect_url: API_URL,
    };
    // create invoice
    const transactionResult = await apiCall<{
      status: string;
      invoice_url: string;
      errors?: { [key: string]: string }[];
      message?: string;
    }>(`${XENDIT_URL}/v2/invoices`, {
      method: 'POST',
      body: JSON.stringify(paymentPayload),
      headers: new Headers(XENDIT_HEADER),
    });
    if (transactionResult.errors) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: transactionResult.message };
    }
    const { invoice_url } = transactionResult;
    const arrPayload = Object.values(dataPayload);
    const updateKeys = Object.keys(dataPayload).join(',');

    // save order in DB
    const [result] = await orderService.createOrder(updateKeys, arrPayload);
    if (result.affectedRows === 0) Logger.error(`Order creation failed: No affected row when creating one.`);
    return { affectedRows: result.affectedRows, invoice_url };
  }
};

const updateOrder = async (requestPayload: { [key: string]: string | number }, idToUpdate = 'id') => {
  const { id, ...rest } = requestPayload;
  if (rest.payment_date) rest.payment_date = new Date(rest.payment_date).toLocaleString('sv-SE');
  if (rest.delivery_date) rest.delivery_date = new Date(rest.delivery_date).toLocaleString('sv-SE');
  if (rest.receive_date) rest.receive_date = new Date(rest.receive_date).toLocaleString('sv-SE');
  Object.keys(rest).forEach((field) => !rest[field] && delete rest[field]);
  const keys = Object.keys(rest).map((item) => `${item} = ?`);
  const values = Object.values(rest).filter((item) => item);
  const dataPayload = {
    keys,
    values,
  };
  if (keys.length > 0) {
    const keyId = idToUpdate;
    // check whether order is not created yet in Biteship and create an order
    if (rest.status === 1) {
      const [resultOrderDetail] = await orderService.selectOrderById([String(id)], keyId);
      if (Array.isArray(resultOrderDetail)) {
        const { courier_company, order_number, courier_type, user_detail, product_detail } = resultOrderDetail[0];
        const orderBiteshipPayload = {
          shipper_contact_name: 'Nutriwell Admin',
          shipper_contact_phone: '087877072828',
          shipper_contact_email: 'garamgarena@nutriwell.co.id',
          shipper_organization: 'Nutriwell Global Jaya',
          origin_contact_name: 'Nutriwell Admin',
          origin_contact_phone: '089638139125',
          origin_address: 'Cemplang Baru A/3',
          origin_postal_code: 16112,
          destination_contact_name: user_detail.recipient_name,
          destination_contact_phone: user_detail.recipient_phone_number,
          destination_address: `${user_detail.address_detail}, ${user_detail.subdistrict}, ${user_detail.district}, ${user_detail.province}`,
          destination_postal_code: user_detail.postal_code,
          courier_company,
          courier_type,
          delivery_type: 'now',
          items: [
            {
              name: product_detail.product_name,
              value: product_detail.total_price,
              quantity: product_detail.quantity,
              weight: product_detail.total_weight,
            },
          ],
          reference_id: order_number,
        };

        const orderSentResult = await apiCall<{ success: boolean; id: string; error?: string }>(
          `${BITESHIP_URL}/v1/orders`,
          {
            method: 'POST',
            body: JSON.stringify(orderBiteshipPayload),
            headers: new Headers(BITESHIP_HEADER),
          },
        );
        if (orderSentResult.success) {
          dataPayload.keys.push('external_id = ?');
          dataPayload.values.push(orderSentResult.id);
          const checkIndex = dataPayload.keys.indexOf('status = ?');
          if (checkIndex !== -1) {
            dataPayload.values[checkIndex] = 2;
          }
        } else Logger.error({ name: ERROR_NAME.BAD_REQUEST, message: orderSentResult.error });
      }
    }
    // update the payload from body and biteship response if any
    const [result] = await orderService.updateOrder(dataPayload, keyId, id);
    return result;
  }
  return {
    affectedRows: 0,
  };
};

const selectOrders = async (requestPayload: QueryOrders, methodQuery: string = 'and') => {
  const { queryTemplate, queryValue } = queriesMaker(requestPayload, methodQuery, 'orders');
  const [result] = await orderService.selectOrders(queryTemplate, queryValue);
  return result;
  return [];
};

const selectOrderById = async (requestPayload: string) => {
  const id = requestPayload;
  const [result] = await orderService.selectOrderById([id]);
  return result;
  return [];
};

const getTracking = async (requestPayload: string) => {
  const orderSentResult = await apiCall<{
    success: boolean;
    id: string;
    courier: { [key: string]: string };
    error?: string;
  }>(`${BITESHIP_URL}/v1/orders/${requestPayload}`, {
    headers: new Headers(BITESHIP_HEADER),
  });
  if (orderSentResult.success) return orderSentResult.courier;
  else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not obtain history of shipment' };
};

export { createOrder, updateOrder, selectOrders, getTracking, selectOrderById };
