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
  referrer_code: {
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
