const React = require('react');

function host(name) {
  return function SafeAreaHost({children, ...props}) {
    return React.createElement(name, props, children);
  };
}

module.exports = {
  SafeAreaProvider: host('SafeAreaProvider'),
  SafeAreaView: host('SafeAreaView'),
};
