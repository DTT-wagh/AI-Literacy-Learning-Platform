import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

import {AppNavigator} from './src/navigation/AppNavigator';
import {colors} from './src/shared/theme/tokens';
import {userStore} from './src/store/userStore';

function App(): React.JSX.Element {
  const [hydrated, setHydrated] = useState(userStore.hydrated);

  useEffect(() => {
    const unsubscribe = userStore.subscribe(() => setHydrated(userStore.hydrated));
    void userStore.hydrate();
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: colors.canvas}}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
        {hydrated ? <AppNavigator /> : <LoadingScreen />}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function LoadingScreen(): React.JSX.Element {
  return (
    <View accessibilityLabel="正在恢复登录状态" style={styles.loading}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});

export default App;
