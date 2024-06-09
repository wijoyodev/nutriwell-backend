import { XENDIT_HEADER, XENDIT_URL } from '../../settings';
import { apiCall, monthBeforeGenerator, queriesMaker, taxDeducter } from '../../utils';
import * as disbursementService from '../../services/disbursements';
import * as rewardService from '../../services/rewards';
import { ERROR_NAME, TAX_DISBURSEMENT } from '../../constants';

export const createDisbursement = async (requestPayload: {
  user_id: string;
  amount: number;
  account_bank_code: string;
  account_bank_name: string;
  account_bank_number: string;
  description: string;
}) => {
  const { user_id, amount, account_bank_code, account_bank_name, account_bank_number, description } = requestPayload;
  const monthBefore = monthBeforeGenerator();
  const [totalResult] = await rewardService.totalRewards(`WHERE created_at <= ? AND user_id = ?`, [
    monthBefore,
    user_id,
  ]);
  if (Array.isArray(totalResult)) {
    const totalCashable = Number(totalResult[0].total_reward);
    if (totalCashable - Number(amount) < 0)
      throw { name: ERROR_NAME.BAD_REQUEST, message: 'The amount is exceeding the total cashable of user.' };
    else {
      // calculate tax based on amount
      const { amountToDisburse, taxToDeduct } = taxDeducter(amount);
      const disbursementPayload = {
        external_id: user_id + '-' + new Date().getTime(),
        amount: amountToDisburse,
        bank_code: account_bank_code,
        account_holder_name: account_bank_name,
        account_number: account_bank_number,
        description,
      };
      const disbursementResult = await apiCall<{
        status: string;
        id: string;
        errors?: { [key: string]: string }[];
        message?: string;
      }>(`${XENDIT_URL}/disbursements`, {
        method: 'POST',
        body: JSON.stringify(disbursementPayload),
        headers: new Headers(XENDIT_HEADER),
      });
      const dbDisbursement = {
        user_id,
        external_id: disbursementResult.id,
        description,
        disbursement_value: amountToDisburse,
        total_tax: taxToDeduct,
        status_disbursement: disbursementResult.status,
      };
      const [resultCreate] = await disbursementService.createDisbursement(
        Object.keys(dbDisbursement).join(','),
        Object.values(dbDisbursement),
      );
      if (resultCreate && resultCreate.affectedRows) {
        return {
          status: disbursementResult.status,
        };
      }
    }
  }
  return {
    status: 'FAILED',
  };
};

export const updateDisbursement = async (requestPayload: {
  status: string;
  updated: string;
  id: string;
  failure_code?: string;
}) => {
  const { status, id, updated, failure_code } = requestPayload;
  const fieldToUpdate = {
    status_disbursement: status,
    status_code: failure_code ?? '',
    success_disbursement_date: new Date(updated).toLocaleString('sv-SE'),
  };

  const [resultUpdate] = await disbursementService.updateDisbursement(
    Object.keys(fieldToUpdate)
      .map((item) => `${item} = ?`)
      .join(', '),
    [...Object.values(fieldToUpdate), id],
  );
  if (resultUpdate && resultUpdate.affectedRows) {
    return {
      status: resultUpdate.affectedRows,
    };
  }
  return {
    status: 0,
  };
};

export const getDisbursementList = async (queriesPayload: {
  user_id?: string;
  id?: string;
  status?: string[];
  offset?: string;
}) => {
  const { status = ['COMPLETED', 'FAILED', 'PENDING'], user_id, id, offset = '0' } = queriesPayload;
  const { queryTemplate, queryValue } = queriesMaker({ user_id, id }, 'and', 'd', [], {
    key: 'd.status_disbursement',
    value: status.map((item) => JSON.stringify(item)).join(','),
  });
  const [resultDisbursement] = await disbursementService.getDisbursement(queryTemplate, queryValue, offset);
  let resultStat: { total_value: number; status_disbursement: string }[] = [];
  let totalResult: { total_reward: number }[] = [];
  let totalRewards: { total_reward: number }[] = [];
  if (user_id) {
    const [resultStatDb] = await disbursementService.getDisbursementStat(`WHERE user_id = ${user_id}`, [user_id]);
    const monthBefore = monthBeforeGenerator();
    const [totalResultDb] = await rewardService.totalRewards(`WHERE created_at <= ? AND user_id = ?`, [
      monthBefore,
      user_id,
    ]);
    const [totalRewardsDb] = await rewardService.totalRewards(`WHERE user_id = ?`, [user_id]);
    if (Array.isArray(resultStatDb) && Array.isArray(totalResultDb) && Array.isArray(totalRewardsDb)) {
      resultStat = resultStatDb;
      totalResult = totalResultDb;
      totalRewards = totalRewardsDb;
    }
  }

  if (Array.isArray(resultDisbursement)) {
    resultStat.map((item) => {
      item.total_value = Number(item.total_value);
      return item;
    });
    return {
      data: resultDisbursement.map((item) => {
        item.disbursement_value = Number(item.disbursement_value);
        item.total_tax = Number(item.total_tax);
        return item;
      }),
      disburse_success: resultStat.filter((item) => item.status_disbursement === 'COMPLETED')[0],
      disburse_failed: resultStat.filter((item) => item.status_disbursement === 'FAILED')[0],
      disburse_pending: resultStat.filter((item) => item.status_disbursement === 'PENDING')[0],
      tax_detail: TAX_DISBURSEMENT,
      disburse_quota:
        Number(totalResult[0]?.total_reward) -
        resultStat.filter((item) => item?.status_disbursement === 'COMPLETED')[0]?.total_value,
      total_rewards: Number(totalRewards[0]?.total_reward) ?? 0,
      offset: Number(offset) ?? 0,
      limit: 10,
    };
  }
  return [];
};

export const listBank = async () => {
  const listBankResult = await apiCall(`${XENDIT_URL}/available_disbursements_banks`, {
    method: 'GET',
    headers: new Headers(XENDIT_HEADER),
  });
  return listBankResult;
};
