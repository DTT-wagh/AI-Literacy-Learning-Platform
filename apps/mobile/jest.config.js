module.exports = {
  preset: 'jest-expo',
  // pnpm nests React Native under .pnpm, so the preset's default pattern
  // misses its Flow source. Transform dependencies for this small test suite.
  transformIgnorePatterns: [],
  setupFilesAfterEnv: ['<rootDir>/test/expoSetup.js'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/test/asyncStorageMock.js',
    '^react-native$': '<rootDir>/test/reactNativeMock.js',
    '^react-native-safe-area-context$': '<rootDir>/test/safeAreaMock.js',
    '^react-native-mmkv$': '<rootDir>/test/mmkvMock.js',
    '^@react-native-community/netinfo$': '<rootDir>/test/netInfoMock.js',
    '^expo-image-picker$': '<rootDir>/test/imagePickerMock.js',
  },
};
