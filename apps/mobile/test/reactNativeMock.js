const React = require('react');

function host(name) {
  return function NativeHost({children, ...props}) {
    return React.createElement(name, props, children);
  };
}

module.exports = {
  ActivityIndicator: host('ActivityIndicator'),
  Animated: {
    View: host('AnimatedView'),
    ValueXY: class ValueXY {
      constructor() {
        this.x = 0;
        this.y = 0;
      }
      getTranslateTransform() {
        return [];
      }
    },
    event: () => () => {},
    spring: () => ({start: callback => callback && callback()}),
  },
  FlatList: host('FlatList'),
  Image: host('Image'),
  Pressable: host('Pressable'),
  Platform: {
    OS: 'android',
    select: options => options.android ?? options.default,
  },
  PanResponder: {
    create: handlers => ({panHandlers: handlers}),
  },
  ScrollView: host('ScrollView'),
  StatusBar: host('StatusBar'),
  Text: host('Text'),
  TextInput: host('TextInput'),
  View: host('View'),
  StyleSheet: {
    create: styles => styles,
  },
  useWindowDimensions: () => ({height: 844, width: 390}),
};
