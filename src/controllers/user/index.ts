import { NextFunction, Response, Request } from 'express';
import { validationResult } from 'express-validator';
import Logger from '../../lib/logger';
import { phoneNumberChecker, referralCodeGenerator } from '../../utils';
import { CONFIRM_PASSWORD_ERROR, ERROR_NAME } from '../../constants';
import { findProfile, findUser, register, registerAdmin as registerNewAdmin, update } from '../../api/user';
import { QueryUser, User } from '../../types';
import { API_URL } from '../../settings';

const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Register user -client ${JSON.stringify(req.client)}- ${req.body.email}: start`);
    // validation for body request
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    const {
      password,
      confirm_password,
      referrer_code,
      referrer_id,
      email,
      gender,
      phone_number_country,
      full_name,
      phone_number,
      date_of_birth,
    } = req.body;
    // adjusting data to fit the requirement
    const payload: User = {
      password,
      confirm_password,
      referrer_code,
      referrer_id,
      email,
      gender,
      phone_number_country,
      full_name,
      phone_number: phoneNumberChecker(phone_number),
      referral_code: referralCodeGenerator(),
      date_of_birth: new Date(date_of_birth).toLocaleString('sv-SE'),
      role: 4,
      status: 1,
    };
    // check if there is avatar image uploaded
    if (req.file) payload.avatar_url = API_URL + req.file?.path.split('uploads')[1];
    // registering flow start (hash password, create token and refresh token, save to DB)
    const result = await register(payload);
    Logger.info(`Register user -client ${JSON.stringify(req.client)}- ${req.body.email}: finish`);
    res.status(201).json({ result });
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
    const validation = validationResult(req);
    if (!validation.isEmpty()) {
      throw { name: ERROR_NAME.BAD_REQUEST, message: validation.array() };
    }
    const { name, email, password, role } = req.body;
    const payload = {
      email,
      full_name: name,
      password,
      role,
      status: 1,
    };
    const result = await registerNewAdmin(payload);
    Logger.info(`Register admin -client ${JSON.stringify(req.client)}-: finish`);
    res.status(201).json({ result });
  } catch (err) {
    Logger.error(`Register admin -client ${JSON.stringify(req.client)}-: ${JSON.stringify(err)}`);
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getUserByValue = async (
  req: Request<NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>, QueryUser>,
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
    const { id } = req.params;
    // if no keys or request file, return to client
    if (Object.keys(payload).length < 1 && !req.file) return res.status(200).json({ result: { status: 0 } });
    // if id of user or editor from middleware is false, throw error
    if (!id) throw { name: ERROR_NAME.BAD_REQUEST, message: 'id could not be empty.' };
    if (!editor) throw { name: ERROR_NAME.BAD_REQUEST, message: 'do not have access.' };
    //if user is customer but payload id is not the same as middleware throw error
    if (role === '4' && id !== user_id)
      throw { name: ERROR_NAME.BAD_REQUEST, message: 'do not have access to update.' };
    // validate password body if any
    if (payload.password && payload.confirm_password) {
      if (payload.password !== payload.confirm_password)
        throw { name: ERROR_NAME.BAD_REQUEST, message: CONFIRM_PASSWORD_ERROR };
    }
    // if any image uploaded
    if (req.file) {
      payload.avatar_url = API_URL + req.file.path.split('uploads')[1];
    }

    if (payload.date_of_birth) payload.date_of_birth = new Date(payload.date_of_birth).toLocaleString('sv-SE');
    if (payload.phone_number) payload.phone_number = phoneNumberChecker(payload.phone_number);
    const result = await update(payload, id, req.headers['x-reset-token']);
    Logger.info(`Update user -client ${JSON.stringify(req.client)}- ${JSON.stringify(req.user)}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(`Update user -client ${JSON.stringify(req.client)}- ${req.user}: ${JSON.stringify(err)}`);
    let errorPayload = err;
    if (err instanceof Error) errorPayload = { name: err.name, message: err.message };
    next(errorPayload);
  }
};

const getProfileById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Get profile by id -client ${JSON.stringify(req.client)}- ${req.user}: start`);
    const { id } = req.params;
    const result = await findProfile(id);
    Logger.info(`Get profile by id -client ${JSON.stringify(req.client)}- ${req.user}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(`Get profile by id -client ${JSON.stringify(req.client)}- ${req.user}: ${JSON.stringify(err)}`);
    next(err);
  }
};

const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    Logger.info(`Get my profile -client ${JSON.stringify(req.client)}- ${req.user}: start`);
    const { user_id } = req.user;
    const result = await findProfile(user_id ? user_id : '');
    Logger.info(`Get my profile -client ${JSON.stringify(req.client)}- ${req.user}: finish`);
    res.status(200).json({ result });
  } catch (err) {
    Logger.error(`Get my profile -client ${JSON.stringify(req.client)}- ${req.user}: ${JSON.stringify(err)}`);
    next(err);
  }
};

export { registerUser, getUserByValue, getMe, updateUser, registerAdmin, getProfileById };
