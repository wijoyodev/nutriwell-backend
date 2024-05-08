import { NextFunction, Response, Request } from 'express';
import { validationResult } from 'express-validator';
import { ERROR_NAME } from '../../constants';
import * as authApi from '../../api/auth';
import Logger from '../../lib/logger';
import { phoneNumberChecker } from '../../utils';

const refreshTokenUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Refresh token user -client ${JSON.stringify(req.client)}- ${req.body.user}: start`);
    // validation for body request
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    // assign data from request
    const { authorization } = req.headers;
    const { user_id } = req.user;
    const { refresh_token } = req.body;
    const tokenData = {
      user: user_id,
      token: authorization,
      refresh_token,
    };
    const result = await authApi.refreshToken(tokenData);
    Logger.info(`Refresh token user -client ${JSON.stringify(req.client)}- ${req.body.user}: finish`);
    res.status(200).json({ result });
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
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    const { user_account, password } = req.body;
    const result = await authApi.login(phoneNumberChecker(user_account), password);
    Logger.info(`Login user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(200).json({ result });
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
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    const { email, refresh_token } = req.body;
    const result = await authApi.logout(email, refresh_token);
    Logger.info(`Logout user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(200).json({ result: { status: result.affectedRows, email } });
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
    await authApi.resetPassword(email);
    Logger.info(`Reset password user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(200).json({ result: { message: 'Request has been processed' } });
  } catch (err) {
    let errorPayload = err;
    Logger.error(
      `Reset password user -client ${JSON.stringify(req.client)}- ${req.body.email}: ${JSON.stringify(err)}`,
    );
    if (err instanceof Error) errorPayload = { name: ERROR_NAME.RESET_PASSWORD, message: err.message };
    next(errorPayload);
  }
};

const resetPasswordVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Reset password user verification -client ${JSON.stringify(req.client)}- ${req.params.token}: start`);
    const { token } = req.params;
    if (!token) throw { name: ERROR_NAME.BAD_REQUEST, message: 'token is empty' };
    const result = await authApi.resetPasswordVerification(token);
    Logger.info(`Reset password user verification -client ${JSON.stringify(req.client)}- ${req.params.token}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    let errorPayload = err;
    Logger.error(
      `Reset password user verification -client ${JSON.stringify(req.client)}- ${req.params.token}: ${JSON.stringify(err)}`,
    );
    if (err instanceof Error) errorPayload = { name: ERROR_NAME.RESET_PASSWORD, message: err.message };
    next(errorPayload);
  }
};

const verificationEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Verification email for register -client ${JSON.stringify(req.client)}- ${req.body.email}: start`);
    if (!req.body.email) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Email must be filled.' };
    const payload = {
      email: req.body.email,
      referrer_code: req.body.referrer_code ?? null,
    };
    const result = await authApi.verificationEmail(payload);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(
      `Verification email for register -client ${JSON.stringify(req.client)}- ${req.body.email}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: ERROR_NAME.RESET_PASSWORD, message: err.message };
    next(errorPayload);
  }
};

export { refreshTokenUser, loginUser, logoutUser, resetPasswordUser, verificationEmail, resetPasswordVerification };
