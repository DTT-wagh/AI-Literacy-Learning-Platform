/* global jest */

const grantedPermission = {
  granted: true,
  canAskAgain: true,
  expires: 'never',
  status: 'granted',
};

module.exports = {
  getMediaLibraryPermissionsAsync: jest.fn(async () => grantedPermission),
  getCameraPermissionsAsync: jest.fn(async () => grantedPermission),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => grantedPermission),
  requestCameraPermissionsAsync: jest.fn(async () => grantedPermission),
  launchImageLibraryAsync: jest.fn(async () => ({canceled: true, assets: null})),
  launchCameraAsync: jest.fn(async () => ({canceled: true, assets: null})),
};
