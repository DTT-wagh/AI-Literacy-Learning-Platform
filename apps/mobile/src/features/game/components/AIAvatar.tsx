import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

export function AIAvatar({message}: {message: string}): React.JSX.Element {
  return (
    <View accessibilityLabel={`文文，AI学习助手：${message}`} style={styles.container}>
      <View style={styles.avatar}><Text style={styles.avatarText}>AI</Text></View>
      <View style={styles.copy}>
        <Text style={styles.name}>文文 · AI学习助手</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: '#EEF8F9'},
  avatar: {width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.brand},
  avatarText: {color: colors.surface, fontSize: 14, lineHeight: 20, fontWeight: '800'},
  copy: {flex: 1, gap: spacing.xs},
  name: {color: colors.brand, fontSize: 14, lineHeight: 20, fontWeight: '700'},
  message: {color: colors.text, fontSize: 14, lineHeight: 21},
});
