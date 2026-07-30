import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {mainTabs} from '../constants/navigation';
import {colors, spacing} from '../shared/theme/tokens';
import type {MainTab} from '../types/navigation';

type BottomTabBarProps = {
  activeTab: MainTab;
  onTabPress: (tab: MainTab) => void;
};

export function BottomTabBar({activeTab, onTabPress}: BottomTabBarProps): React.JSX.Element {
  return (
    <View style={styles.tabBar}>
      {mainTabs.map(tab => (
        <Pressable
          accessibilityLabel={`切换到${tab.label}`}
          accessibilityState={{selected: activeTab === tab.id}}
          key={tab.id}
          onPress={() => onTabPress(tab.id)}
          style={styles.tabButton}>
          <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    minHeight: 60,
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.brand,
  },
});
