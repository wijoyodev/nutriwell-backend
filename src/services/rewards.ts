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

export { createReward, getRewards, totalRewards, totalRewardThisMonth };
