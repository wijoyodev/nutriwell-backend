import * as bannerService from '../../services/banners';
import { BannerPayload, QueryBanner } from '../../types';
import { identityGenerator, queriesMaker } from '../../utils';
const createBanner = async (requestPayload: { title: string; description: string; image_url: string }) => {
  const [banner] = await bannerService.selectBanner();
  const dataPayload: BannerPayload = { ...requestPayload, code: '' };
  let bannerCode = Math.round(Math.random() * 10);
  if (Array.isArray(banner) && banner.length > 0) {
    const { id } = banner[banner.length - 1];
    bannerCode = id;
  }
  dataPayload.code = identityGenerator('6') + '0' + (bannerCode + 1);
  const [result] = await bannerService.createBanner(dataPayload);
  return result;
};

const updateBanner = async (requestPayload: { [key: string]: string }) => {
  const { id, ...rest } = requestPayload;
  const keys = Object.keys(rest).map((item) => `${item} = ?`);
  const values = Object.values(rest);
  const dataPayload = {
    keys,
    values,
  };
  const [result] = await bannerService.updateBanner(dataPayload, id);
  return result;
};

const selectBanner = async (requestPayload: QueryBanner, methodQuery: string = 'and') => {
  const { queryTemplate, queryValue } = queriesMaker(requestPayload, methodQuery);
  const [result] = await bannerService.selectBanner(queryTemplate, queryValue);
  return result;
};

const deleteBanner = async (requestPayload: string) => {
  const [result] = await bannerService.deleteBanner(requestPayload);
  return result;
};

export { createBanner, updateBanner, selectBanner, deleteBanner };
