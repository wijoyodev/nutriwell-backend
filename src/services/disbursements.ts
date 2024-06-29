import { execute, query } from '.';

const createDisbursement = async (queries: string, values: (string | number)[]) => {
  return await execute(
    `
        INSERT INTO disbursements(${queries})
        VALUES(${values.map(() => '?').join(',')})
    `,
    values,
  );
};

const getDisbursement = async (queries: string, values: string[], offset = '0') => {
  return await execute(
    `SELECT d.*, s.full_name, s.account_bank, s.account_bank_name, s.account_bank_code, s.account_bank_number FROM disbursements d LEFT JOIN users s ON s.id=d.user_id ${queries} ORDER BY created_at DESC LIMIT 10 OFFSET ${offset}`,
    values,
  );
};

const getDisbursementData = async (queries: string, values: string[]) => {
  return await execute(
    `SELECT COUNT(d.id) as total_data FROM disbursements d LEFT JOIN users s ON s.id=d.user_id ${queries}`,
    values,
  );
};

const updateDisbursement = async (queries: string, values: string[]) => {
  return await execute(
    `UPDATE disbursements
    SET ${queries} 
    WHERE external_id = ?
`,
    values,
  );
};

const getDisbursementStat = async (queries: string, values: string[]) => {
  return await execute(
    `
    SELECT SUM(disbursement_value) as total_value, user_id, status_disbursement FROM disbursements ${queries} GROUP BY status_disbursement,user_id
    `,
    values,
  );
};

const getTotalDisbursement = async (user_id: string) => {
  return await query(
    `SELECT SUM(disbursement_value) as total_disbursement FROM disbursements WHERE user_id=${user_id} AND status_disbursement IN ('PENDING','SUCCESS');`,
  );
};

export {
  createDisbursement,
  getDisbursement,
  updateDisbursement,
  getDisbursementStat,
  getTotalDisbursement,
  getDisbursementData,
};
