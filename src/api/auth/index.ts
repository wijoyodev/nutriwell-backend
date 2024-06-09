import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createSession, updateSession, deleteSession, bulkDeleteSession, findSession } from '../../services/sessions';
import { ERROR_NAME } from '../../constants';
import { tokenPayload } from '../../types';
import { findUserByEmail, findUserByRefreshToken, findUserByValue, updateUser } from '../../services/users';
import { emailPayloadGenerator, queriesMaker } from '../../utils';
import { EMAIL_SERVICE } from '../../settings';
import { findNetworkByCode } from '../../services/networks';
import * as verificationService from '../../services/verifications';

export const signToken = (payload: tokenPayload, user = '', newRefreshToken = true) => {
  const privateKey = fs.readFileSync(path.join(__dirname.split('Documents')[0], '.ssh/rs256_nutriwell'), 'utf8');
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256', subject: user, expiresIn: '3h' });
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
    // check if the session is in DB
    const [resultSession] = await findSession(token);
    if (Array.isArray(resultSession) && resultSession.length > 0) {
      // verify user_id
      const { user_id } = resultSession[0];
      if (String(user_id) !== user)
        throw { name: ERROR_NAME.ACCESS_DENIED, message: 'User is not the same as the request payload' };
      // verify refresh token
      const verifyData = verifyToken(refresh_token, user);
      const { payload } = verifyData;
      // payload for token
      const dataUser = {
        id: (payload as tokenPayload).id,
        email: (payload as tokenPayload).email,
        full_name: (payload as tokenPayload).full_name,
        role: (payload as tokenPayload).role,
      };

      // create new token
      const newAccessToken = signToken(dataUser, user, false);
      const bodyResponse: {
        user_id?: number;
        token: string;
        refresh_token: string;
        email?: string;
        phone_number?: string;
        gender?: string;
        full_name?: string;
        date_of_birth?: string;
        avatar_url?: string;
        phone_number_country?: string;
        referral_code?: string;
        role?: number;
      } = {
        token: newAccessToken.token,
        refresh_token,
      };
      const [resultUser] = await findUserByEmail((payload as tokenPayload).email);
      if (Array.isArray(resultUser) && resultUser.length > 0) {
        const {
          id,
          phone_number,
          gender,
          full_name,
          date_of_birth,
          email,
          avatar_url,
          phone_number_country,
          referral_code,
          role,
        } = resultUser[0];
        bodyResponse.phone_number = phone_number;
        bodyResponse.gender = gender;
        bodyResponse.full_name = full_name;
        bodyResponse.date_of_birth = date_of_birth;
        bodyResponse.email = email;
        bodyResponse.avatar_url = avatar_url;
        bodyResponse.user_id = id;
        bodyResponse.phone_number_country = phone_number_country;
        bodyResponse.referral_code = referral_code;
        bodyResponse.role = role;
      }
      // update session
      const [result] = await updateSession(newAccessToken.token, refresh_token);
      if (result && result.affectedRows) {
        return bodyResponse;
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not update new access token to DB.' };
    } else throw { name: ERROR_NAME.ACCESS_DENIED, message: 'No session were found.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'No valid data.' };
};

export const login = async (user_account: string, password: string) => {
  // check whether user exists
  const [usersFound] = await findUserByEmail(user_account);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const {
      password: hashPassword,
      full_name,
      id,
      role,
      phone_number,
      gender,
      date_of_birth,
      avatar_url,
      phone_number_country,
      email,
      referral_code,
    } = usersFound[0];
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
          user_id: id,
          email: email,
          full_name,
          phone_number,
          gender,
          date_of_birth,
          avatar_url,
          phone_number_country,
          referral_code,
          role,
          ...tokenUser,
        };
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not create session for the user in DB' };
    } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Password do not match.' };
  } else throw { name: ERROR_NAME.NOT_FOUND, message: 'Email not found.' };
};

export const logout = async (email: string, refresh_token: string) => {
  // check if email is there and get id
  const { queryTemplate, queryValue } = queriesMaker({ email });
  const [usersFound] = await findUserByValue(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const { id } = usersFound[0];
    // delete session
    const [deleteResult] = await deleteSession(id, refresh_token);
    // unrelated, but to empty session older than 30days
    await bulkDeleteSession();
    if (deleteResult && deleteResult.affectedRows) return deleteResult;
    else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Could not delete session' };
  } else throw { name: ERROR_NAME.NOT_FOUND, message: 'Email not found.' };
};

export const resetPassword = async (email: string) => {
  // check if email is registered
  const { queryTemplate, queryValue } = queriesMaker({ email });
  const [usersFound] = await findUserByValue(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length > 0) {
    const { id, full_name } = usersFound[0];
    // create expire date, days could be changed in this function
    const expireDate = new Date(new Date().setDate(new Date().getDate() + 2));
    const payloadToken = `expiryDate=${expireDate.toJSON()}&email=${email}&id=${id}`;
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
        service_id: EMAIL_SERVICE.SERVICE_ID,
        template_id: EMAIL_SERVICE.TEMPLATE_RESET_PASSWORD_ID,
        user_id: EMAIL_SERVICE.USER_ID,
        accessToken: EMAIL_SERVICE.ACCESS_TOKEN,
        template_params: {
          from_name: 'Nutriwell',
          to_name: full_name,
          reset_link: `https://suitable-evidently-caribou.ngrok-free.app/reset-password/${resetToken}`,
          email_recipient: email,
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
        throw { name: ERROR_NAME.RESET_PASSWORD, message: `Failed to send reset password email: ${result.statusText}` };
      return saveResetToken;
    } else throw { name: ERROR_NAME.RESET_PASSWORD, message: 'Could not save reset token in DB.' };
  } else throw { name: ERROR_NAME.RESET_PASSWORD, message: 'Email not found.' };

  // send email
};

export const resetPasswordVerification = async (resetToken: string) => {
  // check if token is on database
  const [userFound] = await findUserByRefreshToken(resetToken);
  if (Array.isArray(userFound) && userFound.length > 0) {
    const { id, reset_password_expire } = userFound[0];
    if (new Date(reset_password_expire) > new Date()) {
      return {
        user_id: id,
      };
    } else throw { name: ERROR_NAME.EXP_ERROR, message: 'Reset password token has expired.' };
  } else throw { name: ERROR_NAME.NOT_FOUND, message: 'User with the given token not found.' };
};

export const verificationEmail = async (payload: { email: string; referrer_code?: string | null }) => {
  const { email, referrer_code } = payload;
  // check whether user exists
  const { queryTemplate, queryValue } = queriesMaker({ email }, 'and', 's');
  const [usersFound] = await findUserByValue(queryTemplate, queryValue);
  if (Array.isArray(usersFound) && usersFound.length < 1) {
    // find if referrer exists if any
    let referrer_id;
    if (referrer_code) {
      const [referrerExist] = await findNetworkByCode(referrer_code);
      if (Array.isArray(referrerExist)) {
        if (referrerExist.length < 1)
          throw { name: ERROR_NAME.NOT_FOUND, message: 'Could not find the referrer code on database.' };
        else {
          referrer_id = referrerExist[0].id;
        }
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Failed to check referrer code.' };
    }

    const expireDate = new Date(new Date().setDate(new Date().getDate() + 1));
    const payloadToken = `expiryDate=${expireDate.toJSON()}&email=${email}&referrer_code=${referrer_code}&referrer_id=${referrer_id}`;
    // create token
    const verificationToken = btoa(payloadToken);
    const verificationData = {
      email,
      expiry_date: expireDate.toLocaleString('sv-SE'),
      token: verificationToken,
    };
    // create token in database
    const [resultVerification] = await verificationService.createVerification(
      Object.keys(verificationData).join(','),
      Object.values(verificationData),
    );
    if (resultVerification.affectedRows) {
      // send email to user for verification email
      const emailBody = {
        to_name: email,
        register_url: `https://suitable-evidently-caribou.ngrok-free.app/verification-email/${verificationToken}`,
        email_recipient: email,
      };
      const emailCreds = emailPayloadGenerator(EMAIL_SERVICE.TEMPLATE_VERIFICATION_ID, emailBody);
      const result = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailCreds),
      });
      if (result.statusText !== 'OK')
        throw {
          name: ERROR_NAME.VERIFICATION_EMAIL,
          message: `Failed to send verification email: ${result.statusText}`,
        };
      else
        return {
          status: 'OK',
        };
    }
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'already a registered user.' };
};

export const verifyEmail = async (payload: { email: string; token: string; referrer_code: string }) => {
  const { email, token, referrer_code } = payload;
  const { queryTemplate, queryValue } = queriesMaker({ email, token });
  const [resultFind] = await verificationService.getVerifications(queryTemplate, queryValue);
  if (Array.isArray(resultFind)) {
    const notExpiredToken = resultFind.filter((item) => new Date(item.expiry_date) >= new Date());
    if (notExpiredToken.length > 0) {
      return {
        email,
        referrer_code,
      };
    } else throw { name: ERROR_NAME.EXP_ERROR, message: 'Verification token has expired.' };
  } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Verification token can not be validated.' };
};
