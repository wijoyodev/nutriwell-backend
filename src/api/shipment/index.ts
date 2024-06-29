import * as shipmentService from '../../services/shipments';
import { QueryShipment, ShipmentPayload } from '../../types';
import { phoneNumberChecker, queriesMaker } from '../../utils';

const createShipment = async (requestPayload: ShipmentPayload) => {
  const dataPayload: ShipmentPayload = { ...requestPayload };
  dataPayload.recipient_phone_number = phoneNumberChecker(dataPayload.recipient_phone_number);
  const [result] = await shipmentService.createShipment(dataPayload);
  return result;
};

const updateShipment = async (requestPayload: { [key: string]: string }) => {
  const { id, ...rest } = requestPayload;
  const keys = Object.keys(rest).map((item) => `${item} = ?`);
  const values = Object.values(rest);
  const dataPayload = {
    keys,
    values,
  };
  if (keys.length > 0) {
    const [result] = await shipmentService.updateShipment(dataPayload, id);
    return result;
  }
  return {
    affectedRows: 0,
  };
};

const selectShipment = async (requestPayload: QueryShipment, methodQuery: string = 'and') => {
  const { filter, ...rest } = requestPayload;
  const { queryTemplate, queryValue } = queriesMaker(rest, methodQuery);
  const [result] = await shipmentService.selectShipment(queryTemplate, queryValue);
  if (Array.isArray(result)) {
    return filter ? result.filter((obj1, i, arr) => arr.findIndex((obj2) => obj2.city === obj1.city) === i) : result;
  }
};

export { createShipment, updateShipment, selectShipment };
