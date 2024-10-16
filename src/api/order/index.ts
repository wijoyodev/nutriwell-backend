import { CACHE_KEY, ERROR_NAME, PDD_NUMBER, PPN_NUMBER } from '../../constants';
import Logger from '../../lib/logger';
import * as orderService from '../../services/orders';
import * as productService from '../../services/products';
import * as cartService from '../../services/carts';
import * as networkService from '../../services/networks';
import { API_URL, BITESHIP_HEADER, BITESHIP_URL, XENDIT_HEADER, XENDIT_URL } from '../../settings';
import { OrderPayload, QueryOrders } from '../../types';
import { apiCall, orderGenerator, rewardComission } from '../../utils';
import { queriesMaker } from '../../utils';
import { queryCreateReward } from '../../services/rewards';
import { generateCache, getCache } from '../../lib/cache';
import { transaction } from '../../services';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { queryUpdateUserStatus } from '../../services/users';

const createOrder = async (requestPayload: {
  user_id: string;
  cart_id: number;
  address_shipment_id: number;
  courier_type: string;
  courier_company: string;
  courier_name: string;
  courier_service_name: string;
  courier_rate: number;
  shipment_duration_range: string;
}) => {
  try {
    return await transaction( async (conn: PoolConnection) => {
      const {
        user_id,
        cart_id,
        address_shipment_id,
        courier_name,
        courier_service_name,
        courier_rate,
        courier_company,
        courier_type,
        shipment_duration_range,
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
        code: '',
        order_number: String(orderGenerator()),
        status: 0,
      };
      const rangeDelivery = shipment_duration_range ? shipment_duration_range.split(' - ') : [];
      dataPayload.courier_max_time =
        rangeDelivery.length > 1
          ? Number(rangeDelivery[rangeDelivery.length - 1])
          : rangeDelivery.length > 0
            ? Number(rangeDelivery[0])
            : 0;
      // get address detail and product detail
      const [orderDetails] = await conn.execute<ResultSetHeader>(orderService.queryOrderDetails(), [dataPayload.cart_id, dataPayload.address_shipment_id]);
      if (Array.isArray(orderDetails) && orderDetails.length > 0) {
        const { user_detail, product_detail, total_price_after_tax, total_price } = orderDetails[0];
        dataPayload.total_purchase = total_price + dataPayload.courier_rate;
        dataPayload.total_purchase_after_tax = total_price_after_tax + dataPayload.courier_rate;
        // payment payload to xendit
        const paymentPayload = {
          external_id: dataPayload.order_number,
          amount: dataPayload.total_purchase_after_tax,
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
          expiry_date: string;
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
        const { invoice_url, expiry_date } = transactionResult;
        // add result from xendit to DB
        dataPayload.payment_url = invoice_url;
        dataPayload.payment_expiry_date = new Date(expiry_date).toLocaleString('sv-SE');
        const arrPayload = Object.values(dataPayload);
        const updateKeys = Object.keys(dataPayload).join(',');
        // save order in DB
        const [result] = await conn.execute<ResultSetHeader>(orderService.queryCreateOrder(updateKeys, arrPayload), arrPayload);
        // update certain cart to be non active in product page
        await conn.execute(cartService.queryUpdateStatusCart(),[0, cart_id]);
        const { product_name, description, product_weight, product_images, price, price_after_tax, product_id } = product_detail;
        // wait for product_histories data to be made
        await conn.execute(productService.queryCreateProductHistory(),[product_id, cart_id, product_name, description, product_weight, product_images, price, price_after_tax]);
        if (result.affectedRows === 0) Logger.error(`Order creation failed: No affected row when creating one.`);
        await conn.execute(queryUpdateUserStatus([user_id]), [1])
        return { affectedRows: result.affectedRows, invoice_url };
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not obtain cart and addresss data. Mismatch ids.' };  
    })
  }catch(err) {
    throw { name: ERROR_NAME.BAD_REQUEST, message: 'Order process cannot be done.' };
  }
};

const updateOrder = async (requestPayload: { [key: string]: string | number }, idToUpdate = 'id') => {
  try {
    return await transaction(async (conn: PoolConnection) => {
      const { id, ...rest } = requestPayload;
      // format date based on DB format
      if (rest.payment_date) rest.payment_date = new Date(rest.payment_date).toLocaleString('sv-SE');
      if (rest.delivery_date) rest.delivery_date = new Date(rest.delivery_date).toLocaleString('sv-SE');
      if (rest.receive_date) rest.receive_date = new Date(rest.receive_date).toLocaleString('sv-SE');
      // if null, payload field will be deleted
      Object.keys(rest).forEach((field) => !rest[field] && rest[field] !== 0 && delete rest[field]);
      const keys = Object.keys(rest).map((item) => `${item} = ?`);
      const values = Object.values(rest).filter((item) => item || item === 0);
      const dataPayload = {
        keys,
        values,
      };
      // if there is to update, update to biteship and DB
      if (keys.length > 0) {
        const keyId = idToUpdate;

        const [resultOrderDetail] = await conn.execute<ResultSetHeader>(orderService.querySelectOrderById(keyId), [String(id)]);
        if (Array.isArray(resultOrderDetail)) {
          const {
            user_id,
            courier_company,
            order_number,
            courier_type,
            user_detail,
            product_detail,
            courier_max_time,
            estimated_delivery_date,
          } = resultOrderDetail[0];
          const { total_price } = product_detail;
          const { full_name } = user_detail;
          // update the estimation delivery when status become 2 for the first time
          if (rest.status === 2 && !estimated_delivery_date) {
            const estimatedDeliveryTime = new Date(
              new Date().setDate(new Date().getDate() + courier_max_time),
            ).toLocaleString('sv-SE');
            dataPayload.keys.push('estimated_delivery_date = ?');
            dataPayload.values.push(estimatedDeliveryTime);
          }
          // check whether order is not created yet in Biteship and create an order
          if (rest.status === 1) {
            const orderBiteshipPayload = {
              shipper_contact_name: 'Nutriwel Global Jaya',
              shipper_contact_phone: '082122683838',
              shipper_contact_email: 'garamgarena@nutriwell.co.id',
              shipper_organization: 'PT. Nutriwel Global jaya',
              origin_contact_name: 'Nutriwel Global Jaya',
              origin_contact_phone: '082122683838',
              origin_address:
                'Pergudangan sentra prima park, Jl. Palem Manis Raya blok. C11, RT.004/RW.003, Gandasari, Kec. Jatiuwung, Kota Tangerang, Banten',
              origin_postal_code: 15137,
              destination_contact_name: user_detail.recipient_name,
              destination_contact_phone: user_detail.recipient_phone_number,
              destination_address: `${user_detail.address_detail}, ${user_detail.district}, ${user_detail.province}`,
              destination_postal_code: user_detail.postal_code,
              courier_company,
              courier_type,
              delivery_type: 'now',
              items: [
                {
                  name: product_detail.product_name,
                  value: product_detail.price,
                  quantity: product_detail.quantity,
                  weight: product_detail.product_weight,
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
            // add payload of external id of biteship id
            if (orderSentResult.success) {
              dataPayload.keys.push('external_id = ?');
              dataPayload.values.push(orderSentResult.id);
            } else Logger.error({ name: ERROR_NAME.BAD_REQUEST, message: orderSentResult.error });
          }

          if(rest.status === 3) {
             // insert rewards for upline when downline has finished order
             await conn.execute(networkService.queryUpdateTransactionStatus(), ['1', user_id]);
             const [resultNetwork] = await conn.execute<ResultSetHeader>(networkService.queryFindNetworkById(), [user_id]);
             if (Array.isArray(resultNetwork) && resultNetwork.length > 0) {
               await Promise.all(
                 ['first', 'second', 'third', 'fourth', 'fifth'].map(
                   (item, index) =>
                     resultNetwork[0][`upline_${item}_id`] &&
                     conn.execute(queryCreateReward(
                       'user_id,reward_profit,description',
                       [
                         resultNetwork[0][`upline_${item}_id`],
                         rewardComission(total_price, item),
                         `Pembelian Produk dari ${full_name} (level ${index + 1})`,
                       ],
                       rewardComission(total_price, item)
                     ),
                       [
                         resultNetwork[0][`upline_${item}_id`],
                         rewardComission(total_price, item),
                         `Pembelian Produk dari ${full_name} (level ${index + 1})`,
                       ],
                     ),
                 ),
               );
             } else Logger.error({ name: ERROR_NAME.BAD_REQUEST, message: 'Could not upate reward after payment' });
          }
          // update the payload from body and biteship response if any
          const [result] = await conn.execute<ResultSetHeader>(orderService.queryUpdateOrder(dataPayload, keyId, id), dataPayload.values);
          return result;
        }
      }
      return {
        affectedRows: 0,
      };
    })
  }catch(err) {
    throw { name: ERROR_NAME.BAD_REQUEST, message: 'Order process cannot be updated.'}
  }
};

const selectOrders = async (requestPayload: QueryOrders, methodQuery: string = 'and') => {
  const { sort, offset, ...rest } = requestPayload;
  const { queryTemplate, queryValue } = queriesMaker(rest, methodQuery, 'orders', [
    'shipment_number',
    'external_id',
    'code',
    'order_number',
  ]);
  const [result] = await orderService.selectOrders(queryTemplate, queryValue, sort, offset);
  let totalOrders = 0;
  let totalNetIncome = 0;
  let totalNetIncomeAfterTax = 0;
  if (Array.isArray(result) && result.length > 0) {
    result.map((item) => {
      item.product_detail.product_image = JSON.parse(item.product_detail.product_image);
      item.courier_rate = parseFloat(item.courier_rate);
      item.total_purchase = parseFloat(item.total_purchase);
      item.net_income = parseFloat(item.net_income);
    });
    const [resultTotalOrders] = await orderService.findTotalOrders(queryTemplate, queryValue);
    if (Array.isArray(resultTotalOrders) && resultTotalOrders.length > 0) {
      const { total_orders, total_net_income, total_net_income_after_tax } = resultTotalOrders[0];
      totalOrders = total_orders;
      totalNetIncome = parseFloat(total_net_income);
      totalNetIncomeAfterTax = parseFloat(total_net_income_after_tax);
    }
    return {
      data: result,
      tax_detail: {
        ppn_tax: PPN_NUMBER,
        pdd_tax: PDD_NUMBER,
      },
      offset: Number(offset) || 0,
      limit: 10,
      total: { totalOrders, totalNetIncome, totalGrossIncome: totalNetIncomeAfterTax },
    };
  }
  return {
    data: [],
    offset: Number(offset) || 0,
    limit: 10,
    total: 0,
  };
};

const selectOrderById = async (requestPayload: string) => {
  const id = requestPayload;
  const [result] = await orderService.selectOrderById([id]);
  if (Array.isArray(result) && result.length > 0) {
    result[0].product_detail.product_image = JSON.parse(result[0].product_detail.product_image);
    result[0].courier_rate = parseFloat(result[0].courier_rate);
    result[0].total_purchase = parseFloat(result[0].total_purchase);
    return {
      data: result,
      tax_detail: {
        ppn_tax: PPN_NUMBER,
        pdd_tax: PDD_NUMBER,
      },
    };
  } else return [];
};

const getTracking = async (requestPayload: string) => {
  const cacheData = getCache(CACHE_KEY.tracking+requestPayload);
  if (!cacheData) {
    const orderSentResult = await apiCall<{
      success: boolean;
      id: string;
      courier: { [key: string]: string };
      error?: string;
    }>(`${BITESHIP_URL}/v1/orders/${requestPayload}`, {
      headers: new Headers(BITESHIP_HEADER),
    });
    if (orderSentResult.success) {
      const saveCache = generateCache(CACHE_KEY.tracking+requestPayload, orderSentResult.courier);
      if (!saveCache) Logger.error(`Cache: Set cache with key ${CACHE_KEY.tracking+requestPayload} failed`);
      return orderSentResult.courier;
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not obtain history of shipment' };
  } else {
    Logger.info(`Cache: Generate tracking data with cache`);
    return cacheData;
  }
};

export { createOrder, updateOrder, selectOrders, getTracking, selectOrderById };
