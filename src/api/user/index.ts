import bcrypt from 'bcrypt';
import { User, UserAdmin } from '../../types';
import {
  createAdmin,
  createUser,
  findTotalUser,
  findUserAdmin,
  findUserByValue,
  findUserNetworkList,
  updateUser,
} from '../../services/users';
import { signToken } from '../auth';
import { ERROR_NAME } from '../../constants';
import { createSession } from '../../services/sessions';
import { findNetworkByCode, networkOrderStat, updateNetworkLevel } from '../../services/networks';
import { queriesMaker } from '../../utils';

export const register = async (data: User) => {
  // check whether user exists through its phone number
  const { queryTemplate, queryValue } = queriesMaker({ phone_number: data.phone_number });
  const [usersFound] = await findUserByValue(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length < 1) {
    const { password, referrer_id, ...rest } = data;
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      ...rest,
      password: hashedPassword,
    };
    Object.keys(data).forEach((field) => !data[field as keyof User] && delete data[field as keyof User]);
    const payloadKeys = Object.keys(payload).filter((item) => item !== 'confirm_password');
    const payloadValues = Object.values(payload).filter((item) => item !== payload.confirm_password);
    // create new user in DB
    const [result] = await createUser(payloadKeys, payloadValues);
    if (result && result.affectedRows) {
      // update network level
      if (referrer_id) await updateNetworkLevel(referrer_id);
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
          ...tokenUser,
        };
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create session for the user in DB' };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create user.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'already a registered user.' };
};

export const registerAdmin = async (data: UserAdmin) => {
  // check whether user exists
  const { queryTemplate, queryValue } = queriesMaker({ email: data.email });
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
  const [resultNetwork] = await networkOrderStat([userId]);
  return { data: resultUser, network_reference: resultNetwork };
};

export const update = async (data: { [key: string]: string }, id: string, headerToken?: string | string[]) => {
  Object.keys(data).forEach((field) => field === 'confirm_password' && delete data[field]);
  // variable for update network level
  let referrerNewId;
  let referrerOldId;
  // variable to assign the reset token and expiry date
  let reset_token;
  let reset_expiry;
  // variable to set referrer code of user to be updated
  let referrerCode;
  // check if user exists and set user existing data to assign variable
  const { queryTemplate, queryValue } = queriesMaker({ id });
  const [usersFound] = await findUserByValue(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const { referrer_code, reset_password_token, reset_password_expire } = usersFound[0];
    reset_token = reset_password_token;
    reset_expiry = reset_password_expire;
    referrerCode = referrer_code;
  } else throw { name: ERROR_NAME.NOT_FOUND, message: 'Could not find the id.' };
  // to get old and new referral user id to update the level of network
  if (data.referrer_code) {
    const [referrerNewExist] = await findNetworkByCode(data.referrer_code);
    const [referrerOldExist] = await findNetworkByCode(referrerCode);
    if (Array.isArray(referrerNewExist) && Array.isArray(referrerOldExist)) {
      if (referrerNewExist.length < 1) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Referrer not found.' };
      const { id: userNewId } = referrerNewExist[0];
      const { id: userId } = referrerOldExist[0];
      referrerNewId = userNewId;
      referrerOldId = userId;
    }
  }
  // if reset password token is there, check whether it's valid or not
  if (headerToken && reset_token && reset_expiry) {
    const currentDate = new Date();
    if (new Date(reset_expiry) > currentDate) {
      if (headerToken !== reset_token) throw { name: ERROR_NAME.BAD_REQUEST, message: 'Token is not the same.' };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Token is expired.' };
  }
  // hash updated password
  if (data.password) data.password = await bcrypt.hash(data.password, 10);
  // update user
  const field = Object.keys(data);
  const values = Object.values(data);
  if (field.length < 1)
    return {
      affectedRows: 0,
    };
  const [result] = await updateUser(field, ['id'], [...values, String(id)]);
  // update network level position based on update result
  if (result.affectedRows) {
    if (referrerNewId) await updateNetworkLevel(referrerNewId);
    if (referrerOldId) await updateNetworkLevel(referrerOldId);
    return {
      status: result.affectedRows,
      updated_data: {
        ...data,
      },
    };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not update user.' };
};
