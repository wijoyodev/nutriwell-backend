import * as bannerService from '../../services/banners';
import { BannerPayload, QueryBanner } from '../../types';
import { queriesMaker } from '../../utils';
const createBanner = async (requestPayload: { title: string; description: string; image_url: string }) => {
  const dataPayload: BannerPayload = { ...requestPayload, code: '' };
  const [result] = await bannerService.createBanner(dataPayload);
  return result;
};

const updateBanner = async (requestPayload: { [key: string]: string }) => {
  const { id, ...rest } = requestPayload;
  Object.keys(rest).forEach((field) => !rest[field] && delete rest[field]);
  const keys = Object.keys(rest).map((item) => `${item} = ?`);
  const values = Object.values(rest).filter((item) => item);
  const dataPayload = {
    keys,
    values,
  };
  if (keys.length > 0) {
    const [result] = await bannerService.updateBanner(dataPayload, id);
    return result;
  }

  return {
    affectedRows: 0,
  };
};

const selectBanner = async (requestPayload: QueryBanner, methodQuery: string = 'and') => {
  const { queryTemplate, queryValue } = queriesMaker(requestPayload, methodQuery, '', ['title', 'description']);
  const [result] = await bannerService.selectBanner(queryTemplate, queryValue);
  return result;
};

const deleteBanner = async (requestPayload: string) => {
  const [result] = await bannerService.deleteBanner(requestPayload);
  return result;
};

export { createBanner, updateBanner, selectBanner, deleteBanner };
