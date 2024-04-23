import { NextFunction, Response, Request } from 'express';
import { validationResult } from 'express-validator';
import Logger from '../../lib/logger';
import { phoneNumberChecker, referralCodeGenerator } from '../../utils';
import { CONFIRM_PASSWORD_ERROR, DOMAIN, ERROR_NAME } from '../../constants';
import { findProfile, findUser, register, registerAdmin as registerNewAdmin, update } from '../../api/user';
import { UserQueries } from '../../types';

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Register user -client ${JSON.stringify(req.client)}- ${req.body.email}: start`);
    // validation for body request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: result.array() };
    }
    // adjusting data to fit requirement
    const payload = {
      ...req.body,
      avatar_url: req.file ? DOMAIN + req.file?.path.split('uploads')[1] : null,
      phone_number: phoneNumberChecker(req.body.phone_number),
      referral_code: referralCodeGenerator(),
      date_of_birth: new Date(req.body.date_of_birth).toLocaleString('sv-SE'),
    };
    // registering flow start (hash password, create token and refresh token, save to DB)
    const userCreds = await register(payload);
    Logger.info(`Register user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(201).json({ result: userCreds });
  } catch (err: unknown) {
    Logger.error(`Register user -client ${JSON.stringify(req.client)}- ${req.body.email}: ${JSON.stringify(err)}`);
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const registerAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Register admin -client ${JSON.stringify(req.client)}-: start`);
    // validation for body request
    const result = validationResult(req);
    if (!result.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: result.array() };
    }
    const { name, email, password, role } = req.body;
    const payload = {
      email,
      full_name: name,
      password,
      role,
    };
    const resultAdmin = await registerNewAdmin(payload);
    Logger.info(`Register admin -client ${JSON.stringify(req.client)}-: finish`);
    res.status(201).json({ message: resultAdmin });
  } catch (err) {
    Logger.error(`Register admin -client ${JSON.stringify(req.client)}-: ${JSON.stringify(err)}`);
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getUserByValue = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, UserQueries>,
  res: Response,
  next: NextFunction,
) => {
  try {
    Logger.info(`Get user by value -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const queries = req.query;
    const result = await findUser(queries);
    Logger.info(`Get user by value -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({
      result,
    });
  } catch (err) {
    Logger.error(
      `Get user by value -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: ${JSON.stringify(err)}`,
    );
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Update user -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: start`);
    const payload = req.body;
    const { editor, user_id, role } = req.user;
    if (!payload.id) throw { name: ERROR_NAME.BAD_REQUEST, message: 'id could not be empty.' };
    if (!editor) throw { name: ERROR_NAME.BAD_REQUEST, message: 'do not have access.' };
    if (payload.password && payload.confirm_password) {
      if (payload.password !== payload.confirm_password)
        throw { name: ERROR_NAME.BAD_REQUEST, message: CONFIRM_PASSWORD_ERROR };
    }
    if (role === '4' && payload.id !== user_id)
      throw { name: ERROR_NAME.BAD_REQUEST, message: 'do not have access to update.' };
    const updateResult = await update(payload);
    Logger.info(`Update user -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ status: updateResult, message: 'user updated.' });
  } catch (err) {
    Logger.error(`Update user -client ${JSON.stringify(req.client)}- ${req.user}: ${JSON.stringify(err)}`);
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.error(`Get my profile -client ${JSON.stringify(req.client)}- ${req.user}: start`);
    const { user_id } = req.user;
    const resultProfile = user_id ? await findProfile(user_id) : [];
    Logger.error(`Get my profile -client ${JSON.stringify(req.client)}- ${req.user}: start`);
    res.status(200).json({ data: resultProfile });
  } catch (err) {
    Logger.error(`Get my profile -client ${JSON.stringify(req.client)}- ${req.user}: ${JSON.stringify(err)}`);
    next(err);
  }
};

export { registerUser, getUserByValue, updateUser, registerAdmin, getMyProfile };
