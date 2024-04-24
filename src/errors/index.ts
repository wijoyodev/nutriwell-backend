import { ERROR_MESSAGE, ERROR_NAME } from '../constants';

export const errorBodyGenerator = (
  errorName = ERROR_NAME.DEFAULT_ERROR,
  message = ERROR_MESSAGE.SOMETHING_WENT_WRONG,
) => {
  let errorCode = 500;
  switch (errorName) {
    case ERROR_NAME.BAD_REQUEST:
    case ERROR_NAME.EXP_ERROR:
      errorCode = 400;
      break;
    case ERROR_NAME.NOT_FOUND:
      errorCode = 404;
      break;
    default:
      break;
  }
  return {
    name: errorName,
    message,
    errorCode,
  };
};
