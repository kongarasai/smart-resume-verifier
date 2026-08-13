import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { ShieldCheck, LogOut } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { useAuthStore } from '../store/authStore';

export function HeaderBar({ title }: { title: string }) {
  const { logout } = useAuthStore();

  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <ShieldCheck color={Colors.accent} size={22} />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
        <LogOut color={Colors.ink[300]} size={18} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: Colors.ink[900],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.ink[50],
  },
  logoutBtn: {
    padding: 6,
  },
});
