import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {colors, radius, spacing} from '../../../shared/theme/tokens';

export function OfflineNotice({offline}: {offline: boolean}): React.JSX.Element {
  const text = offline
    ? '离线模式：已下载的审核内容和本地规则可以继续使用。'
    : '在线可同步学习事件；核心游戏仍可使用本地内容完成。';
  return (
    <View accessibilityLiveRegion="polite" style={[styles.notice, offline && styles.offline]}>
      <Text style={styles.icon}>{offline ? '◌' : '✓'}</Text>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: '#E7F6EC'},
  offline: {backgroundColor: '#FFF4D6'},
  icon: {color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: '800'},
  text: {flex: 1, color: colors.text, fontSize: 13, lineHeight: 19},
});
