const storage = new Map();

module.exports = {
  getItem: key => Promise.resolve(storage.get(key) || null),
  setItem: (key, value) => {
    storage.set(key, value);
    return Promise.resolve();
  },
  removeItem: key => {
    storage.delete(key);
    return Promise.resolve();
  },
  multiRemove: keys => {
    keys.forEach(key => storage.delete(key));
    return Promise.resolve();
  },
};
