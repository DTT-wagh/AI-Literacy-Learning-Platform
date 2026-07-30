const NetInfo = {
  fetch: async () => ({isConnected: true, isInternetReachable: true}),
  addEventListener: () => () => {},
};

module.exports = {__esModule: true, default: NetInfo};
