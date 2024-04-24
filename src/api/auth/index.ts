import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createSession, updateSession, deleteSession } from '../../services/sessions';
import { ERROR_NAME } from '../../constants';
import { tokenPayload } from '../../types';
import { findUserByValue, updateUser } from '../../services/users';

export const signToken = (payload: tokenPayload, user = '', newRefreshToken = true) => {
  const privateKey = fs.readFileSync(path.join(__dirname.split('Documents')[0], '.ssh/rs256_nutriwell'), 'utf8');
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', subject: user, expiresIn: '1h' });
  if (newRefreshToken) {
    const refreshToken = jwt.sign(payload, privateKey, { algorithm: 'RS256', subject: user, expiresIn: '30d' });
    return {
      token,
      refreshToken,
    };
  }
  return {
    token,
  };
};

export const verifyToken = (token: string, user = '') => {
  const publicKey = fs.readFileSync(path.join(__dirname.split('Documents')[0], '.ssh/rs256_nutriwell.pub'), 'utf8');
  const verifyToken = jwt.verify(token, publicKey, { algorithms: ['RS256'], subject: user, complete: true });
  return verifyToken;
};

export const refreshToken = async (tokenData: {
  user: string | null;
  token: string | undefined;
  refresh_token: string | null;
}) => {
  const { user, token, refresh_token } = tokenData;
  if (token && user && refresh_token) {
    // verify token
    const verifyData = verifyToken(token, user);
    const { payload } = verifyData;
    const dataUser = {
      id: (payload as tokenPayload).id,
      email: (payload as tokenPayload).email,
      full_name: (payload as tokenPayload).full_name,
    };
    // create new token
    const newAccessToken = signToken(dataUser, user, false);
    // update session
    const [result] = await updateSession(newAccessToken.token, refresh_token);
    if (result && result.affectedRows) {
      return {
        access_token: newAccessToken.token,
        refresh_token,
        user,
      };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not update new access token to DB.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'no invalid data' };
};

export const login = async (email: string, password: string) => {
  // check if the email exist
  const [usersFound] = await findUserByValue([email], ['email']);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const { password: hashPassword, full_name, id, role } = usersFound[0];
    // check if the password match
    const matchedPassword = await bcrypt.compare(password, hashPassword);
    if (matchedPassword) {
      // create token
      const tokenUser = signToken({ id, email, full_name, role }, String(id));
      // create session
      const [saveSession] = await createSession(tokenUser.token, tokenUser.refreshToken, id);
      // return same as register
      if (saveSession && saveSession.affectedRows) {
        return {
          email: email,
          full_name,
          ...tokenUser,
        };
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create session for the user in DB' };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Password do not match.' };
  } else throw { name: ERROR_NAME.NOT_FOUND, message: 'Email not found.' };
};

export const logout = async (email: string, refresh_token: string) => {
  // check if email is there and get id
  const [usersFound] = await findUserByValue([email], ['email']);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const { id } = usersFound[0];
    // verify refresh token
    verifyToken(refresh_token, String(id));
    // delete session
    const [deleteResult] = await deleteSession(id, refresh_token);
    if (deleteResult && deleteResult.affectedRows) return deleteResult.affectedRows;
    else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not delete session' };
  } else throw { name: ERROR_NAME.NOT_FOUND, message: 'Email not found.' };
};

export const resetPassword = async (email: string) => {
  // check if email is registered
  const [usersFound] = await findUserByValue([email], ['email']);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const { id, full_name } = usersFound[0];
    // create expire date
    const expireDate = new Date(new Date().setDate(new Date().getDate() + 2));
    const payloadToken = `expiryDate=${expireDate.toJSON()}&email=${email}`;
    // create token
    const resetToken = await bcrypt.hash(payloadToken, 10);
    // save token in DB
    const [saveResetToken] = await updateUser(
      ['reset_password_token', 'reset_password_expire'],
      ['id'],
      [resetToken, expireDate.toLocaleString('sv-SE'), id],
    );
    if (saveResetToken && saveResetToken.affectedRows) {
      // send email to user for reset password
      const emailCreds = {
        service_id: 'service_tr7a0ze',
        template_id: 'template_p6qt6gx',
        user_id: 'ozxbQV2BQmrxvbrsG',
        accessToken: 'h_fZIMsTJThI-ZLvOozLf',
        template_params: {
          from_name: 'Nutriwell',
          to_name: full_name,
          reset_link: `http://localhost:3001?token=${resetToken}`,
          email_recipient: 'mayanafitri25@gmail.com',
        },
      };
      const result = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailCreds),
      });
      if (result.statusText !== 'OK')
        throw { name: ERROR_NAME.RESET_PASSWORD, message: `Failed to send email: ${result.statusText}` };
      return saveResetToken;
    } else throw { name: ERROR_NAME.RESET_PASSWORD, message: 'Could not save reset token in DB.' };
  } else throw { name: ERROR_NAME.RESET_PASSWORD, message: 'Email not found.' };

  // send email
};
