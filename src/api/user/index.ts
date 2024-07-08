import bcrypt from 'bcrypt';
import { User, UserAdmin } from '../../types';
import {
  createAdmin,
  createUser,
  findTotalUser,
  findUserAdmin,
  findUserByValue,
  findUserNetworkList,
  findUserWithPassword,
  updateUser,
} from '../../services/users';
import { signToken } from '../auth';
import { ERROR_NAME } from '../../constants';
import { createSession } from '../../services/sessions';
// import { networkOrderStat } from '../../services/networks';
import { queriesMaker } from '../../utils';
import { findNetworkByCode } from '../../services/networks';

export const register = async (data: User) => {
  // check whether user exists through its phone number
  const { queryTemplate, queryValue } = queriesMaker({ phone_number: data.phone_number, email: data.email }, 'or', 's');
  const [usersFound] = await findUserByValue(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length < 1) {
    if (data.referrer_code) {
      const [referrerExist] = await findNetworkByCode(data.referrer_code);
      if (Array.isArray(referrerExist)) {
        if (referrerExist.length < 1)
          throw { name: ERROR_NAME.NOT_FOUND, message: 'Could not find the referrer code on database.' };
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Failed to check referrer code.' };
    }
    const { password, ...rest } = data;
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      ...rest,
      password: hashedPassword,
    };
    Object.keys(payload).forEach((field) => !payload[field as keyof User] && delete payload[field as keyof User]);
    const payloadKeys = Object.keys(payload).filter((item) => item !== 'confirm_password');
    const payloadValues = Object.values(payload).filter((item) => item !== payload.confirm_password);
    // create new user in DB
    const [result] = await createUser(payloadKeys, payloadValues);
    if (result && result.affectedRows) {
      // create token and refresh token
      const userData = {
        id: String(result.insertId),
        email: payload.email,
        full_name: payload.full_name,
        role: '4',
      };
      const tokenUser = signToken(userData, String(result.insertId));
      // create session for user
      const [saveSession] = await createSession(tokenUser.token, tokenUser.refreshToken, result.insertId);
      if (saveSession && saveSession.affectedRows) {
        return {
          user_id: result.insertId,
          email: payload.email,
          full_name: payload.full_name,
          phone_number: payload.phone_number,
          gender: payload.gender,
          date_of_birth: payload.date_of_birth,
          avatar_url: payload.avatar_url,
          phone_number_country: payload.phone_number_country,
          referral_code: payload.referral_code,
          role: payload.role,
          ...tokenUser,
        };
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create session for the user in DB' };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create user.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'already a registered user.' };
};

export const registerAdmin = async (data: UserAdmin) => {
  // check whether user exists
  const { queryTemplate, queryValue } = queriesMaker({ email: data.email }, 'and', 's');
  const [usersFound] = await findUserByValue(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length < 1) {
    // hash password
    const { password, ...rest } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      ...rest,
      password: hashedPassword,
    };
    // create new user in DB
    const [result] = await createAdmin(payload);
    if (result) {
      return {
        status: result.affectedRows,
      };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create admin.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'already a registered admin.' };
};

export const findUser = async (data: { [key: string]: string }) => {
  const { userType, offset, sort, location_id, ...rest } = data;
  let totalUsers = 0;
  const queryPayload = { ...rest };
  const inQuery =
    userType === 'member'
      ? {
          key: 's.role',
          value: '4',
        }
      : userType === 'admin'
        ? {
            key: 's.role',
            value: '1,2,3',
          }
        : undefined;
  const { queryTemplate, queryValue } = queriesMaker(queryPayload, 'and', 's', ['full_name', 'email', 'code'], inQuery);
  const queryForMember = location_id ? `${queryTemplate} AND sh.id = ${location_id}` : queryTemplate;
  const [resultUser] =
    userType === 'member'
      ? await findUserNetworkList(queryForMember, queryValue, offset, sort)
      : userType === 'admin'
        ? await findUserAdmin(queryTemplate, queryValue, offset, sort)
        : await findUserByValue(queryTemplate, queryValue, offset, sort);
  const [resultTotalUser] = await findTotalUser(queryTemplate, queryValue);
  if (Array.isArray(resultTotalUser)) {
    const { total_users } = resultTotalUser[0];
    totalUsers = total_users;
  }
  return {
    data: resultUser,
    offset: Number(offset) || 0,
    limit: 10,
    total: totalUsers,
  };
};

export const findProfile = async (userId: string) => {
  const { queryTemplate, queryValue } = queriesMaker({ id: userId }, 'and', 's');
  const [resultUser] = await findUserByValue(queryTemplate, queryValue);
  return {
    data: resultUser,
  };
};

export const update = async (data: { [key: string]: string }, id: string, headerToken?: string | string[]) => {
  Object.keys(data).forEach((field) => field === 'confirm_password' && delete data[field]);
  // variable to assign the reset token and expiry date
  let reset_token;
  let reset_expiry;
  const { old_password, ...rest } = data;
  // check if user exists and set user existing data to assign variable
  const { queryTemplate, queryValue } = queriesMaker({ id }, 'and', 's');
  const [usersFound] = await findUserWithPassword(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const { reset_password_token, reset_password_expire, password: hashedPassword } = usersFound[0];
    if (!headerToken && old_password) {
      const matchedPassword = await bcrypt.compare(old_password, hashedPassword);
      if (!matchedPassword) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Old pin does not match.' };
    }
    reset_token = reset_password_token;
    reset_expiry = reset_password_expire;
  } else throw { name: ERROR_NAME.NOT_FOUND, message: 'Could not find the id.' };
  // if reset password token is there, check whether it's valid or not
  if (headerToken && reset_token && reset_expiry) {
    const currentDate = new Date();
    if (new Date(reset_expiry) > currentDate) {
      if (headerToken !== reset_token) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Token is not the same.' };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Token is expired.' };
  }
  // hash updated password
  if (rest.password) rest.password = await bcrypt.hash(data.password, 10);
  // update user
  const field = Object.keys(rest);
  const values = Object.values(rest);
  if (field.length < 1)
    return {
      affectedRows: 0,
    };
  const [result] = await updateUser(field, ['id'], [...values, String(id)]);
  if (result.affectedRows) {
    Object.keys(rest).forEach((field) => field === 'password' && delete rest[field]);
    return {
      status: result.affectedRows,
      updatedData: rest,
    };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not update user.' };
};
