import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Bell,
  CheckCircle2,
  Info,
  Sparkles,
  Bot,
  Briefcase,
  CheckCheck,
  Circle,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch {
      // Keep existing state if offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    try {
      await apiClient.patch(`/notifications/${id}/read`);
    } catch {}
  };

  const markAllRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {}
  };

  const formatTimestamp = (dateStr: any) => {
    if (!dateStr) return 'Just now';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';

    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const getNotifIcon = (type: string, isRead: boolean) => {
    const color = isRead ? '#94a3b8' : '#0f172a';
    switch (type) {
      case 'interview':
        return <Bot size={18} color={isRead ? '#94a3b8' : '#2563eb'} />;
      case 'job':
        return <Briefcase size={18} color={isRead ? '#94a3b8' : '#059669'} />;
      case 'welcome':
      case 'sparkles':
        return <Sparkles size={18} color={isRead ? '#94a3b8' : '#d97706'} />;
      default:
        return <Info size={18} color={color} />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={[styles.notifCard, item.is_read && styles.readCard]}
      onPress={() => !item.is_read && markRead(item.id)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconBox,
          item.is_read ? styles.iconBoxRead : styles.iconBoxUnread,
        ]}
      >
        {getNotifIcon(item.type, item.is_read)}
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.notifTitle, item.is_read && styles.readText]}>
            {item.title}
          </Text>
          {!item.is_read && (
            <View style={styles.unreadBadge}>
              <Circle size={6} fill="#2563eb" color="#2563eb" />
            </View>
          )}
        </View>

        <Text style={[styles.notifBody, item.is_read && styles.readBody]}>
          {item.message}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.notifDate}>{formatTimestamp(item.created_at)}</Text>
          {item.is_read && (
            <View style={styles.readTag}>
              <CheckCircle2 size={12} color="#94a3b8" />
              <Text style={styles.readTagText}>Read</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <DashboardLayout title="Notifications" scrollable={false}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.topRow}>
          <View>
            <Text style={styles.subText}>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </Text>
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllBtn}
              onPress={markAllRead}
              activeOpacity={0.7}
            >
              <CheckCheck size={14} color="#0f172a" />
              <Text style={styles.markAllText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id || String(index)}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconBg}>
                  <Bell size={48} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>No Notifications</Text>
                <Text style={styles.emptyDesc}>
                  You do not have any new notifications at the moment. Pull down to refresh.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
  },
  subText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#0f172a' },
  listContent: { padding: 16, paddingBottom: 40 },
  notifCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
  },
  readCard: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
    opacity: 0.8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxUnread: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  iconBoxRead: {
    backgroundColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    lineHeight: 19,
  },
  readText: {
    fontWeight: '600',
    color: '#475569',
  },
  unreadBadge: {
    marginTop: 4,
  },
  notifBody: {
    fontSize: 13,
    color: '#334155',
    marginTop: 4,
    lineHeight: 18,
  },
  readBody: {
    color: '#64748b',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  notifDate: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  readTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  readTagText: { fontSize: 11, color: '#94a3b8' },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
  },
});
