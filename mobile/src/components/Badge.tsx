import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'green' | 'amber' | 'blue' | 'neutral';
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'green':
        return { bg: 'rgba(16, 185, 129, 0.15)', text: Colors.signal.green, border: Colors.signal.green };
      case 'amber':
        return { bg: 'rgba(251, 191, 36, 0.15)', text: Colors.accent, border: Colors.accent };
      case 'blue':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: Colors.signal.blue, border: Colors.signal.blue };
      case 'neutral':
      default:
        return { bg: Colors.ink[800], text: Colors.ink[200], border: Colors.ink[700] };
    }
  };

  const style = getStyles();

  return (
    <View style={[styles.badge, { backgroundColor: style.bg, borderColor: style.border }]}>
      <Text style={[styles.label, { color: style.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
