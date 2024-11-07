import * as rewardService from '../../services/rewards';
import * as disbursementService from '../../services/disbursements';
import { monthBeforeGenerator, queriesMaker } from '../../utils';
import { findUserStatus } from '../../services/users';

export const getRewards = async (offset = '0', user_id = '') => {
  const queries = {
    user_id,
  };
  const { queryTemplate, queryValue } = queriesMaker(queries, 'and');
  const [result] = await rewardService.getRewards(queryTemplate, queryValue);
  const [countReward] = await rewardService.countReward(queryTemplate, queryValue);
  const date = monthBeforeGenerator();
  const [totalRewards] = await rewardService.totalRewards(queryTemplate, queryValue);
  const [totalResult] = await rewardService.totalRewards(
    `WHERE created_at <= '${date}' ${user_id ? `AND user_id = ${user_id}` : ''}`,
    [],
  );
  const [totalRewardThisMonth] = await rewardService.totalRewardThisMonth(user_id ? `AND user_id = ${user_id}` : '');
  const [totalDisbursement] = await disbursementService.getTotalDisbursement(user_id);
  const [userFound] = await findUserStatus(user_id);
  if (
    Array.isArray(result) &&
    Array.isArray(totalResult) &&
    Array.isArray(totalRewards) &&
    Array.isArray(totalRewardThisMonth) &&
    Array.isArray(totalDisbursement) &&
    Array.isArray(countReward) &&
    Array.isArray(userFound)
  ) {
    const totalReward = userFound[0].status ? Number(totalRewards[0].total_reward) : Number(totalRewards[0].total_reward) - Number(totalRewardThisMonth[0].total_this_month)
    return {
      data: result.map((item) => {
        item.reward_profit = Number(item.reward_profit);
        return item;
      }),
      total_cashable: Number(totalResult[0].total_reward) - Number(totalDisbursement[0].total_disbursement),
      total_reward: totalReward,
      ...countReward[0],
      total_this_month: Number(totalRewardThisMonth[0].total_this_month),
      offset: Number(offset),
      limit: 10,
    };
  }
  return [];
};
