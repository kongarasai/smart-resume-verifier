import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  PlusCircle,
  Megaphone,
  Trophy,
  User,
  Github,
  Code2,
  BookOpen,
  Briefcase,
  Clock,
  Calendar,
  MessageSquare,
  Lock,
  Sparkles,
  TrendingUp,
  Bell,
  Star,
  Search,
  LogOut,
} from 'lucide-react-native';
import { useAuthStore } from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuthStore();
  const currentRouteName = props.state.routes[props.state.index]?.name;

  const role = user?.role || 'candidate';

  const navMap: Record<string, { label: string; icon: any; target: string }[]> = {
    mentor: [
      { label: 'Dashboard', icon: LayoutDashboard, target: 'MentorDashboard' },
      { label: 'Groups', icon: Users, target: 'MentorGroups' },
      { label: 'Create Problems', icon: PlusCircle, target: 'Problems' },
      { label: 'Announcements', icon: Megaphone, target: 'Announcements' },
      { label: 'Notifications', icon: Bell, target: 'Notifications' },
    ],
    teacher: [
      { label: 'Dashboard', icon: LayoutDashboard, target: 'TeacherDashboard' },
      { label: 'Create Problems', icon: PlusCircle, target: 'Problems' },
      { label: 'Rankings', icon: Trophy, target: 'TeacherRankings' },
      { label: 'Notifications', icon: Bell, target: 'Notifications' },
    ],
    candidate: [
      { label: 'My Profile', icon: User, target: 'Profile' },
      { label: 'My Groups', icon: Users, target: 'MyGroups' },
      { label: 'Mock Interview', icon: Sparkles, target: 'Interview' },
      { label: 'GitHub', icon: Github, target: 'GitHub' },
      { label: 'LeetCode', icon: Code2, target: 'LeetCode' },
      { label: 'Practice', icon: BookOpen, target: 'Practice' },
      { label: 'Rankings', icon: Trophy, target: 'Ranking' },
      { label: 'Jobs', icon: Briefcase, target: 'Jobs' },
      { label: 'Progress', icon: Clock, target: 'Progress' },
      { label: 'Interviews', icon: Calendar, target: 'Interviews' },
      { label: 'Messages', icon: MessageSquare, target: 'Messages' },
      { label: 'Notifications', icon: Bell, target: 'Notifications' },
      { label: 'Privacy', icon: Lock, target: 'Privacy' },
    ],
    hr: [
      { label: 'Candidates', icon: LayoutDashboard, target: 'HRDashboard' },
      { label: 'Talent Analytics', icon: TrendingUp, target: 'HRAnalytics' },
      { label: 'Shortlist', icon: Star, target: 'HRShortlist' },
      { label: 'Req. Match', icon: Search, target: 'HRMatch' },
      { label: 'Interviews', icon: Calendar, target: 'Interviews' },
      { label: 'Messages', icon: MessageSquare, target: 'Messages' },
      { label: 'Notifications', icon: Bell, target: 'Notifications' },
      { label: 'My Profile', icon: User, target: 'HRProfile' },
    ],
  };

  const navItems = navMap[role] || navMap.candidate;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={styles.brandRow}>
          <ShieldCheck size={20} color="#cbd5e1" />
          <Text style={styles.brandTitle}>ResumeVerify</Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          {user?.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.userAvatarImg} />
          ) : (
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {(user?.full_name?.[0] || user?.email?.[0] || 'M').toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.full_name || user?.email?.split('@')[0] || 'User'}
            </Text>
            <Text style={styles.userRole}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Navigation List */}
      <ScrollView
        style={styles.navScroll}
        contentContainerStyle={styles.navContent}
        showsVerticalScrollIndicator={false}
      >
        {navItems.map((item) => {
          const isActive =
            currentRouteName === item.target ||
            (item.target === 'MentorDashboard' && currentRouteName === 'MentorDashboard') ||
            (item.target === 'MentorGroups' &&
              (currentRouteName === 'MentorGroups' || currentRouteName === 'GroupCandidates'));

          const IconComponent = item.icon;

          return (
            <TouchableOpacity
              key={item.target}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => props.navigation.navigate(item.target)}
              activeOpacity={0.8}
            >
              <IconComponent
                size={16}
                color={isActive ? '#1c1917' : '#a8a29e'}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer / Sign Out */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={() => logout()}
          activeOpacity={0.7}
        >
          <LogOut size={16} color="#a8a29e" strokeWidth={1.8} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1c1a', // matching dark warm ink-900 background
  },
  brandHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2926',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#383431',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  userRole: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 1,
  },
  navScroll: {
    flex: 1,
  },
  navContent: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 3,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#ffffff',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a8a29e',
  },
  navLabelActive: {
    color: '#1c1917',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2d2926',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  signOutText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a8a29e',
  },
});

