const stores = new Map();

function createMMKV({id = 'default'} = {}) {
  const values = stores.get(id) || new Map();
  stores.set(id, values);
  return {
    getString: key => typeof values.get(key) === 'string' ? values.get(key) : undefined,
    getNumber: key => typeof values.get(key) === 'number' ? values.get(key) : undefined,
    set: (key, value) => values.set(key, value),
    remove: key => values.delete(key),
  };
}

module.exports = {createMMKV};
