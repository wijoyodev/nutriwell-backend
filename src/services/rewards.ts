import { execute, query } from '.';

const createReward = async (payloadKey: string, payloadValue: (string | number)[], reward: number) => {
  return await execute(
    `INSERT INTO rewards(${payloadKey})
   VALUES(${payloadValue.map(() => '?').join(',')})
    ON DUPLICATE KEY UPDATE reward_profit = reward_profit + ${reward}
   `,
    payloadValue,
  );
};

const getRewards = async (queries?: string, values?: string[], offset = '0') => {
  return await execute(
    `
  SELECT * FROM rewards ${queries} ORDER BY created_at DESC LIMIT 10 OFFSET ${offset};
  `,
    values,
  );
};

const countReward = async (queries?: string, values?: string[], offset = '0') => {
  return await execute(
    `
  SELECT COUNT(id) AS total_data FROM rewards ${queries} ORDER BY created_at DESC LIMIT 10 OFFSET ${offset};
  `,
    values,
  );
};

const totalRewardThisMonth = async (queries?: string) => {
  return await query(`
  SELECT SUM(reward_profit) as total_this_month FROM rewards WHERE MONTH(created_at) = MONTH(CURRENT_DATE) ${queries}
  `);
};

const totalRewards = async (queries: string, values: string[]) => {
  return await execute(
    `
  SELECT SUM(reward_profit) as total_reward FROM rewards ${queries}
  `,
    values,
  );
};

const queryCreateReward = (payloadKey: string, payloadValue: (string | number)[], reward: number) => {
  return  `INSERT INTO rewards(${payloadKey})
  VALUES(${payloadValue.map(() => '?').join(',')})
   ON DUPLICATE KEY UPDATE reward_profit = reward_profit + ${reward}
  `
}

const queryDeleteRewardByIds = (userIds: string[]) => `DELETE FROM rewards
WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') AND created_at < DATE_ADD(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) 
AND user_id IN (${userIds.join(",")});`

export { createReward, getRewards, totalRewards, totalRewardThisMonth, countReward, queryCreateReward, queryDeleteRewardByIds };
