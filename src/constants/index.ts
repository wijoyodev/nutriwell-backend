export const FIELD_EMPTY = "the field can't be empty.";
export const CONFIRM_PASSWORD_ERROR = 'confirm password must be the same as the password.';
export const PASSWORD_ERROR = 'the length must be 6 digit.';
export const AUTH = {
  CLIENT_COOKIE: 'client_id',
};
export const ERROR_MESSAGE = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  SOMETHING_WENT_WRONG: 'SOMETHING_WENT_WRONG',
  FAILED_PROCESS: 'FAILED_TO_PROCESS',
  INVALID_TOKEN: 'INVALID_TOKEN',
};

export const ERROR_NAME = {
  BAD_REQUEST: 'BadRequestError',
  DB_ERROR: 'DatabaseError',
  UNAUTHORIZED: 'Unauthorized',
  ACCESS_DENIED: 'noAccess',
  NOT_FOUND: 'NotFoundError',
  EXP_ERROR: 'TokenExpiredError',
  DEFAULT_ERROR: 'Error',
  INVALID_TOKEN: 'JsonWebTokenError',
  RESET_PASSWORD: 'ResetPassword',
  VERIFICATION_EMAIL: 'VerificationEmail',
};

export const TAX_DISBURSEMENT = {
  under_tax: {
    tax: 0.025,
    limit: 120000000,
  },
  upper_tax: {
    tax: 0.075,
    min: 120000001,
  },
};

export const CACHE_KEY = {
  rates: 'courierRates',
  tracking: 'tracking',
};

export const PDD_NUMBER = 1.11;
export const PPN_NUMBER = 0.11;

export const LEVEL_NAME: { [key: string]: string } = {
  '1': 'first',
  '2': 'second',
  '3': 'third',
  '4': 'fourth',
  '5': 'fifth',
};

export const FETCH_BATCH_SIZE = 100;
export const UPDATE_BATCH_SIZE = 100;
