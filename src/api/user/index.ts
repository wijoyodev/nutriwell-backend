import bcrypt from 'bcrypt';
import { User, UserAdmin } from '../../types';
import { createAdmin, createUser, findUserByValue, getUserMaxValue, updateUser } from '../../services/users';
import { signToken } from '../auth';
import { ERROR_NAME } from '../../constants';
import { createSession } from '../../services/sessions';
import { identityGenerator } from '../../utils';

export const register = async (data: User) => {
  // check whether user exists
  const [usersFound] = await findUserByValue([data.phone_number, data.email], [], ['phone_number', 'email']);
  const [user] = await getUserMaxValue();
  const totalUsers = Array.isArray(user) && user.length > 0 ? user[0].total + 1 : 0;
  if (Array.isArray(usersFound) && usersFound.length < 1) {
    const { password, ...rest } = data;
    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      ...rest,
      password: hashedPassword,
    };
    // modify the id based on role
    const userRole = payload.role || '4';
    const userId = identityGenerator(userRole) + '0' + totalUsers;
    payload.code = userId;
    // create new user in DB
    const [result] = await createUser(payload);
    if (result) {
      // create token and refresh token
      const userData = {
        id: String(result.insertId),
        email: payload.email,
        full_name: payload.full_name,
        role: userRole,
      };
      const tokenUser = signToken(userData, String(result.insertId));
      const [saveSession] = await createSession(tokenUser.token, tokenUser.refreshToken, result.insertId);
      if (saveSession && saveSession.affectedRows) {
        return {
          email: payload.email,
          full_name: payload.full_name,
          ...tokenUser,
        };
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create session for the user in DB' };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create user.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'already a registered user.' };
};

export const registerAdmin = async (data: UserAdmin) => {
  // check whether user exists
  const [usersFound] = await findUserByValue([data.email], ['email']);
  const [user] = await getUserMaxValue();
  const totalUsers = Array.isArray(user) && user.length > 0 ? user[0].total + 1 : 0;
  if (Array.isArray(usersFound) && usersFound.length < 1) {
    // hash password
    const { password, ...rest } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      ...rest,
      password: hashedPassword,
    };
    // modify the id based on role
    const userRole = payload.role || '3';
    const userId = identityGenerator(userRole) + '0' + totalUsers;
    payload.code = userId;
    // create new user in DB
    const [result] = await createAdmin(payload);
    if (result) {
      return {
        status: result.affectedRows,
      };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create user.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'already a registered user.' };
};

export const findUser = async (data: { [key: string]: string }) => {
  const conditions = [];
  const values = [];
  for (const key in data) {
    conditions.push(key);
    values.push(data[key]);
  }
  const [resultUser] = await findUserByValue(values, conditions);
  return resultUser;
};

export const update = async (data: { [key: string]: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, confirm_password, ...rest } = data;
  if (data.password) data.password = await bcrypt.hash(data.password, 10);
  const field = [];
  const values = [];
  for (const key in rest) {
    field.push(key);
    values.push(data[key]);
  }
  const [result] = await updateUser(field, ['id'], [...values, String(id)]);
  if (result.affectedRows) {
    return result.affectedRows;
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not update user.' };
};
