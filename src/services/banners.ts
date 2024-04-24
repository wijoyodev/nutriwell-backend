import { execute, query } from '.';

const createBanner = async (payload: { title: string; description: string; code: string; image_url: string }) => {
  const { title, description, code, image_url } = payload;
  return await execute(
    `
        INSERT INTO banners(title,description,code,image_url)
        VALUES(?,?,?,?)
    `,
    [title, description, code, image_url],
  );
};

const selectBanner = async (conditionSql?: string, conditionValue?: string[]) => {
  return await execute(`SELECT * FROM banners ${conditionSql}`, conditionValue);
};

const updateBanner = async (payload: { [key: string]: string[] }, id: string) => {
  const { keys, values } = payload;
  return await execute(
    `
    UPDATE banners SET ${keys.join(', ')} WHERE id = ${id}
  `,
    values,
  );
};

const deleteBanner = async (payload: string) => {
  return await query(`DELETE FROM banners WHERE id = ${payload}`);
};

export { createBanner, selectBanner, updateBanner, deleteBanner };
