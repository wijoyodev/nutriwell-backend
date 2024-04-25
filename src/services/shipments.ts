import { execute } from '.';
import { ShipmentPayload } from '../types';

const createShipment = async (payload: ShipmentPayload) => {
  const {
    user_id,
    recipient_name,
    recipient_phone_number,
    phone_number_country,
    province,
    city,
    district,
    subdistrict,
    address_detail,
    postal_code,
  } = payload;
  return await execute(
    `
        INSERT INTO shipments
        (user_id,recipient_name,recipient_phone_number,phone_number_country,province,city,district,subdistrict,address_detail,postal_code)
        VALUES(?,?,?,?,?,?,?,?,?,?)
    `,
    [
      user_id,
      recipient_name,
      recipient_phone_number,
      phone_number_country,
      province,
      city,
      district,
      subdistrict,
      address_detail,
      postal_code,
    ],
  );
};

const selectShipment = async (conditionSql?: string, conditionValue?: string[]) => {
  return await execute(`SELECT * FROM shipments ${conditionSql}`, conditionValue);
};

const updateShipment = async (payload: { [key: string]: (string | number)[] }, id: string | number) => {
  const { keys, values } = payload;
  return await execute(
    `
    UPDATE shipments SET ${keys.join(', ')} WHERE user_id = ${id}
  `,
    values,
  );
};

export { createShipment, selectShipment, updateShipment };
