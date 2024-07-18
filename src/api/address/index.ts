import * as addressService from '../../services/adresses';
export const selectProvince = async () => {
  const [resultProvinces] = await addressService.getProvinces();
  return resultProvinces;
};

export const selectCity = async (provinceId: string) => {
  const [resultCities] = await addressService.getCities(provinceId);
  return resultCities;
};

export const selectDistrict = async (cityId: string) => {
  const [resultDistricts] = await addressService.getDistricts(cityId);
  return resultDistricts;
};
