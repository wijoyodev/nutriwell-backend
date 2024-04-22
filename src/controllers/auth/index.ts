import { NextFunction, Response, Request } from 'express';
// import { Request } from '../../types';
import { validationResult } from 'express-validator';
import { ERROR_NAME } from '../../constants';
import { login, logout, refreshToken, resetPassword } from '../../api/auth';
import Logger from '../../lib/logger';

const refreshTokenUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Refresh token user -client ${JSON.stringify(req.client)}- ${req.body.user}: start`);
    // validation for body request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: result.array() };
    }
    const { authorization } = req.headers;
    const { user_id } = req.user;
    const { refresh_token } = req.body;
    const tokenData = {
      user: user_id,
      token: authorization,
      refresh_token,
    };
    const verifyData = await refreshToken(tokenData);
    Logger.info(`Refresh token user -client ${JSON.stringify(req.client)}- ${req.body.user}: finish`);
    res.status(200).json({ data: verifyData });
  } catch (err) {
    Logger.error(`Refresh token user -client ${JSON.stringify(req.client)}- ${req.body.user}: ${JSON.stringify(err)}`);
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Login user -client ${JSON.stringify(req.client)}- ${req.body.email}: start`);
    // validation for body request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: result.array() };
    }
    const { email, password } = req.body;
    const loginResult = await login(email, password);
    Logger.info(`Login user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(200).json({ data: loginResult });
  } catch (err) {
    let errorPayload = err;
    Logger.error(`Login user -client ${JSON.stringify(req.client)}- ${req.body.email}: ${JSON.stringify(err)}`);
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Logout user -client ${JSON.stringify(req.client)}- ${req.body.email}: start`);
    const result = validationResult(req);
    if (!result.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: result.array() };
    }
    const { email, refresh_token } = req.body;
    const logoutResult = await logout(email, refresh_token);
    Logger.info(`Logout user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(200).json({ status: logoutResult, user: email });
  } catch (err) {
    let errorPayload = err;
    Logger.error(`Logout user -client ${JSON.stringify(req.client)}- ${req.body.email}: ${JSON.stringify(err)}`);
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const resetPasswordUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Reset password user -client ${JSON.stringify(req.client)}- ${req.body.email}: start`);
    const { email } = req.body;
    if (!email) throw { name: ERROR_NAME.BAD_REQUEST, message: 'email is empty' };
    await resetPassword(email);
    Logger.info(`Reset password user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(200).json({ message: 'Request has been processed' });
  } catch (err) {
    let errorPayload = err;
    Logger.error(
      `Reset password user -client ${JSON.stringify(req.client)}- ${req.body.email}: ${JSON.stringify(err)}`,
    );
    if (err instanceof Error) errorPayload = { name: ERROR_NAME.RESET_PASSWORD, message: err.message };
    next(errorPayload);
  }
};

export { refreshTokenUser, loginUser, logoutUser, resetPasswordUser };
