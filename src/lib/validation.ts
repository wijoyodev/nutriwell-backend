import { checkSchema } from 'express-validator';
import { CONFIRM_PASSWORD_ERROR, FIELD_EMPTY, PASSWORD_ERROR } from '../constants';

export const registerSchema = checkSchema({
  email: {
    isEmail: true,
  },
  confirm_password: {
    custom: {
      options: (value, { req }) => value === req.body.password,
      errorMessage: CONFIRM_PASSWORD_ERROR,
    },
  },
  password: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
    isLength: {
      options: { max: 6, min: 6 },
      errorMessage: PASSWORD_ERROR,
    },
  },
  phone_number: {
    isMobilePhone: {
      options: ['any'],
    },
  },
  phone_number_country: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  full_name: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  gender: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  date_of_birth: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const registerAdminSchema = checkSchema({
  email: {
    isEmail: true,
  },
  password: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
    isLength: {
      options: { max: 6, min: 6 },
      errorMessage: PASSWORD_ERROR,
    },
  },
  name: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  role: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  status: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const refreshTokenSchema = checkSchema({
  user: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  token: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  refresh_token: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const loginSchema = checkSchema({
  email: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
    isEmail: true,
  },
  password: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
    isLength: {
      options: { max: 6, min: 6 },
      errorMessage: PASSWORD_ERROR,
    },
  },
});

export const logoutSchema = checkSchema({
  email: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
    isEmail: true,
  },
  refresh_token: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const bannerSchema = checkSchema({
  title: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  description: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const productSchema = checkSchema({
  product_name: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  price: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  description: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const shipmentSchema = checkSchema({
  recipient_name: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  recipient_phone_number: {
    isMobilePhone: {
      options: ['any'],
    },
  },
  phone_number_country: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  province: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  city: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  district: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  subdistrict: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  address_detail: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  postal_code: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const cartSchema = checkSchema({
  product_id: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  quantity: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const orderSchema = checkSchema({
  user_id: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  address_shipment_id: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  cart_id: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  courier_company: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  courier_name: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  courier_service_name: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  courier_rate: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  courier_type: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  total_purchase: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});

export const rateSchema = checkSchema({
  destination_postal_code: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  items: {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  'items.*.name': {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  'items.*.weight': {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  'items.*.value': {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
  'items.*.quantity': {
    notEmpty: {
      errorMessage: FIELD_EMPTY,
    },
  },
});
