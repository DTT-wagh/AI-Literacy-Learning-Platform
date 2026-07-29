const {getDefaultConfig} = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

const appRoot = __dirname;
const workspaceRoot = path.resolve(appRoot, '../..');
const appNodeModules = path.resolve(appRoot, 'node_modules');

// PNPM keeps native packages in a virtual store outside the app tree. Metro
// must watch that real path when resolving the app's junctions on Windows.
const realPackagePath = fs.realpathSync(path.join(appNodeModules, 'react-native'));
const virtualStoreRoot = path.dirname(path.dirname(path.dirname(realPackagePath)));

const config = getDefaultConfig(appRoot);

// Resolve packages consistently when this Expo app is run inside the pnpm workspace.
config.watchFolders = [workspaceRoot, virtualStoreRoot];
config.resolver.nodeModulesPaths = [
  appNodeModules,
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  expo: path.resolve(appRoot, 'node_modules/expo'),
  '@babel/runtime': path.resolve(appRoot, 'node_modules/@babel/runtime'),
};

module.exports = config;
