import { Response, NextFunction, Request } from 'express';
import { AUTH, ERROR_NAME } from '../constants';
import { CustomError } from '../types';
import { findSession } from '../services/sessions';
import { verifyToken } from '../api/auth';
import { tokenPayload } from '../types';
import Logger from '../lib/logger';
export const clientInfo = (req: Request, _res: Response, next: NextFunction) => {
  req.client = {
    id: req.query[AUTH.CLIENT_COOKIE] as string,
    host: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    agent: req.headers['user-agent'],
  };
  req.user = {
    user_id: null,
    role: null,
  };
  next();
};

export const checkSession = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers;
    const accessToken = authorization?.split(' ')[1];
    if (accessToken) {
      // check if the session in DB
      const [checkSession] = await findSession(accessToken);
      if (Array.isArray(checkSession) && checkSession.length > 0) {
        const { user_id } = checkSession[0];
        // verify token to check the payload is the same
        const tokenData = verifyToken(accessToken, String(user_id));
        const { payload } = tokenData;
        if (String(user_id) !== (payload as tokenPayload).id)
          throw { name: ERROR_NAME.UNAUTHORIZED, message: 'not match user' };
        req.headers.authorization = accessToken;
        req.user = {
          user_id: String(user_id),
          role: (payload as tokenPayload).role || '1',
        };
        next();
      } else throw { name: ERROR_NAME.UNAUTHORIZED, message: 'token is invalid' };
    } else throw { name: ERROR_NAME.UNAUTHORIZED, message: 'token is invalid.' };
  } catch (err) {
    Logger.error(`Middleware check session -client ${JSON.stringify(req.client)}-: ${JSON.stringify(err)}`);
    next(err);
  }
};

export const errorMiddleware = (err: CustomError, _req: Request, res: Response, _next: NextFunction) => {
  let code = 500;
  let name = err.name;
  switch (name) {
    case ERROR_NAME.BAD_REQUEST:
    case ERROR_NAME.EXP_ERROR:
    case ERROR_NAME.INVALID_TOKEN:
      code = 400;
      break;
    case ERROR_NAME.NOT_FOUND:
      code = 404;
      break;
    case ERROR_NAME.UNAUTHORIZED:
      code = 401;
      break;
    case ERROR_NAME.ACCESS_DENIED:
      code = 403;
      break;
    case ERROR_NAME.RESET_PASSWORD:
      code = 200;
      name = 'Request has been processed';
      break;
    default:
      break;
  }

  const errorPayload = {
    message: name,
  };
  res.status(code).json(errorPayload);
};
