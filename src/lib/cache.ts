import NodeCache from 'node-cache';

const myCache = new NodeCache();

const generateCache = <T>(key: string, data: T, ttl = 3600) => {
  const saveCache = myCache.set(key, data, ttl);
  if (!saveCache) return;
  return saveCache;
};

const getCache = (key: string) => {
  const dataCache = myCache.get(key);
  if (!dataCache) return;
  return dataCache;
};

export { generateCache, getCache };
