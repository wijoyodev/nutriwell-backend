import { execute } from '.';

const createVerification = async (payloadKey: string, payloadValue: (string | number)[]) => {
  return await execute(
    `INSERT INTO verifications(${payloadKey})
   VALUES(${payloadValue.map(() => '?').join(',')})
   `,
    payloadValue,
  );
};

const getVerifications = async (queries?: string, values?: string[]) => {
  return await execute(
    `
  SELECT * FROM verifications ${queries};
  `,
    values,
  );
};

export { createVerification, getVerifications };
