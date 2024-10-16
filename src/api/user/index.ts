import bcrypt from 'bcrypt';
import { User, UserAdmin } from '../../types';
import {
  createAdmin,
  findTotalUser,
  findUserAdmin,
  findUserByValue,
  findUserNetworkList,
  findUserWithPassword,
  queryCountDownlines,
  queryCreateUser,
  queryFindUser,
  queryFindUserByReferral,
  queryGetUserStatus,
  queryListDownlines,
  queryTriggerNewDownline,
  queryUpdateUserStatus,
  updateUser,
} from '../../services/users';
import { signToken } from '../auth';
import { ERROR_NAME, FETCH_BATCH_SIZE } from '../../constants';
import { queryCreateSession } from '../../services/sessions';
import { queriesMaker } from '../../utils';
import { transaction } from '../../services';
import { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import { queryDeleteRewardByIds } from '../../services/rewards';

interface QueueNode {
  userId: number;
  currentLevel: number;
  referral_code?: string;
}

export const register = async (data: User) => {
  try {
    return await transaction(async (conn: PoolConnection) => {
      // check whether user exists through its phone number
      const { queryTemplate, queryValue } = queriesMaker(
        { phone_number: data.phone_number, email: data.email },
        'or',
        's',
      );
      const [usersFound] = await conn.execute(queryFindUser(queryTemplate), queryValue);
      if (Array.isArray(usersFound) && usersFound.length < 1) {
        // check user based on referrer code
        const [referrerFound] = await conn.execute<ResultSetHeader>(queryFindUserByReferral(), [data.referrer_code]);
        if (Array.isArray(referrerFound)) {
          const queue: QueueNode[] = [];
          const { id } = referrerFound[0];
          queue.push({ userId: id, currentLevel: 1 });
          let foundUser: number | null = null;

          while (queue.length > 0) {
            const { userId, currentLevel, referral_code } = queue.shift()!;
            if (currentLevel > 5) {
              continue; // Exceeds maximum levels
            }
            // Count the number of direct downlines
            const [countRows] = await conn.execute(queryCountDownlines(currentLevel), [userId]);
            const count = (countRows as { count: number }[])[0].count;
            if (count < 3) {
              // Found a user with available downline slot
              foundUser = userId;
              data.referrer_code = referral_code ?? data.referrer_code;
              break;
            } else {
              // Fetch downlines ordered by created_at ASC (oldest first)
              const [downlinesRows] = await conn.execute(queryListDownlines(currentLevel), [userId]);

              const downlines: { user_id: number; referral_code: string }[] = downlinesRows as {
                user_id: number;
                referral_code: string;
              }[];

              for (const downline of downlines) {
                queue.push({
                  userId: downline.user_id,
                  currentLevel: currentLevel,
                  referral_code: downline.referral_code,
                });
              }
              queue.push({ userId: id, currentLevel: currentLevel + 1 });
            }
          }
          if (foundUser) {
            const { password, ...rest } = data;
            // hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            const payload = {
              ...rest,
              password: hashedPassword,
            };
            Object.keys(payload).forEach(
              (field) => !payload[field as keyof User] && delete payload[field as keyof User],
            );
            const payloadKeys = Object.keys(payload).filter((item) => item !== 'confirm_password');
            const payloadValues = Object.values(payload).filter((item) => item !== payload.confirm_password);
            // create trigger
            await conn.query(queryTriggerNewDownline());
            // create new user in DB
            const [result] = await conn.execute<ResultSetHeader>(queryCreateUser(payloadKeys), payloadValues);
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
              const [saveSession] = await conn.execute<ResultSetHeader>(queryCreateSession(), [
                tokenUser.token,
                tokenUser.refreshToken,
                result.insertId,
              ]);
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
          } else
            throw {
              name: ERROR_NAME.NOT_FOUND,
              message: 'Could not find available place for new user in any downlines.',
            };
        } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'Failed to check referrer code.' };

        return {};
      } else throw { name: ERROR_NAME.BAD_REQUEST, message: 'already a registered user.' };
    });
  } catch (err) {
    throw { name: ERROR_NAME.BAD_REQUEST, message: 'registration process cannot be done.' };
  }
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

export const setUserStatus = async () => {
  return await transaction(async (conn: PoolConnection) => {
    // check if user status active / inactive
    // if inactive, the reward of current month will be wiped out
    let offset = 0;
    let batchProcessStatus = true;
    while (batchProcessStatus) {
      const [users] = await conn.query<ResultSetHeader>(queryGetUserStatus(), [FETCH_BATCH_SIZE, offset]);
      if (Array.isArray(users) && users.length > 0) {
        const inactiveUsers = users.filter((item) => !item.status).map((user) => user.id);
        if (inactiveUsers.length > 0) {
          await conn.query(queryDeleteRewardByIds(inactiveUsers));
        }
        const mapped = users.map((user) => user.id);
        await conn.execute<ResultSetHeader>(queryUpdateUserStatus(mapped), [0]);
        offset += FETCH_BATCH_SIZE;
      } else {
        batchProcessStatus = false;
        break;
      }
    }
  });
};
