import { query } from '.';

const getProvinces = async () => query(`SELECT * FROM provinces`);
const getCities = async (provinceId?: string) =>
  query(`SELECT * FROM cities ${provinceId ? `WHERE province_id = ${provinceId}` : ''} `);
const getDistricts = async (cityId?: string) =>
  query(`SELECT * FROM districts ${cityId ? `WHERE city_id = ${cityId}` : ''}`);

export { getProvinces, getCities, getDistricts };
