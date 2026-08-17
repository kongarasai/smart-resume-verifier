import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

import LoginScreen from './src/screens/auth/LoginScreen';
import CandidateDashboard from './src/screens/candidate/Dashboard';
import ProfileScreen from './src/screens/candidate/ProfileScreen';
import ProgressScreen from './src/screens/candidate/ProgressScreen';
import RankingScreen from './src/screens/candidate/RankingScreen';
import GitHubScreen from './src/screens/candidate/GitHubScreen';
import LeetCodeScreen from './src/screens/candidate/LeetCodeScreen';
import PrivacyScreen from './src/screens/candidate/PrivacyScreen';
import MessagesScreen from './src/screens/candidate/MessagesScreen';
import PracticeScreen from './src/screens/candidate/PracticeScreen';
import InterviewScreen from './src/screens/candidate/InterviewScreen';
import JobsScreen from './src/screens/candidate/JobsScreen';
import CodingLanguagesScreen from './src/screens/candidate/CodingLanguagesScreen';
import CodingEditorScreen from './src/screens/candidate/CodingEditorScreen';
import AssignmentsScreen from './src/screens/candidate/AssignmentsScreen';
import AssignmentTestScreen from './src/screens/candidate/AssignmentTestScreen';
import MyGroupsScreen from './src/screens/candidate/MyGroupsScreen';

import HRDashboard from './src/screens/hr/Dashboard';
import HRMatchScreen from './src/screens/hr/HRMatchScreen';
import HRProfileScreen from './src/screens/hr/HRProfileScreen';
import ShortlistScreen from './src/screens/hr/ShortlistScreen';
import AnalyticsScreen from './src/screens/hr/AnalyticsScreen';
import CandidateDetail from './src/screens/hr/CandidateDetail';
import InterviewsScreen from './src/screens/shared/InterviewsScreen';
import NotificationsScreen from './src/screens/shared/NotificationsScreen';

import MentorDashboard from './src/screens/mentor/Dashboard';
import GroupsScreen from './src/screens/mentor/GroupsScreen';
import AnnouncementsScreen from './src/screens/mentor/AnnouncementsScreen';
import TeacherDashboard from './src/screens/teacher/Dashboard';
import RankingsScreen from './src/screens/teacher/RankingsScreen';
import GroupAnalyticsScreen from './src/screens/teacher/AnalyticsScreen';
import GroupCandidatesScreen from './src/screens/shared/GroupCandidatesScreen';
import ProblemsScreen from './src/screens/shared/ProblemsScreen';

import HeaderNotificationBell from './src/components/shared/HeaderNotificationBell';
import { useAuthStore } from './src/store/authStore';

const Drawer = createDrawerNavigator();
const queryClient = new QueryClient();

function MainDrawer() {
  const { user } = useAuthStore();

  return (
    <Drawer.Navigator
      id="DrawerNavigator"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#f8fafc', elevation: 0, shadowOpacity: 0 },
        headerTitleStyle: { fontWeight: 'bold', color: '#1e293b' },
        headerTintColor: '#0f172a',
        drawerType: 'slide',
        drawerStyle: { backgroundColor: '#1f1c1a', width: 260 },
        headerRight: () => <HeaderNotificationBell />,
      }}
    >
      {user?.role === 'hr' ? (
        <>
          <Drawer.Screen name="HRDashboard" component={HRDashboard} options={{ title: 'Candidates' }} />
          <Drawer.Screen name="HRAnalytics" component={AnalyticsScreen} options={{ title: 'Talent Analytics' }} />
          <Drawer.Screen name="HRShortlist" component={ShortlistScreen} options={{ title: 'Shortlisted' }} />
          <Drawer.Screen name="HRMatch" component={HRMatchScreen} options={{ title: 'Req. Match' }} />
          <Drawer.Screen name="Interviews" component={InterviewsScreen} options={{ title: 'Interviews' }} />
          <Drawer.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
          <Drawer.Screen name="HRProfile" component={HRProfileScreen} options={{ title: 'My Profile' }} />
          <Drawer.Screen name="CandidateDetail" component={CandidateDetail} options={{ title: 'Candidate Profile', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="Problems" component={ProblemsScreen} options={{ title: 'Problems', drawerItemStyle: { display: 'none' } }} />
        </>
      ) : user?.role === 'mentor' ? (
        <>
          <Drawer.Screen name="MentorDashboard" component={MentorDashboard} options={{ title: 'Mentor Portal' }} />
          <Drawer.Screen name="MentorGroups" component={GroupsScreen} options={{ title: 'Groups' }} />
          <Drawer.Screen name="Problems" component={ProblemsScreen} options={{ title: 'Create Problems' }} />
          <Drawer.Screen name="Announcements" component={AnnouncementsScreen} options={{ title: 'Announcements' }} />
          <Drawer.Screen name="GroupCandidates" component={GroupCandidatesScreen} options={{ title: 'Candidates', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="TeacherAnalytics" component={GroupAnalyticsScreen} options={{ title: 'Group Analytics', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="TeacherRankings" component={RankingsScreen} options={{ title: 'Performance Rankings', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="CandidateDetail" component={CandidateDetail} options={{ title: 'Candidate Profile', drawerItemStyle: { display: 'none' } }} />
        </>
      ) : user?.role === 'teacher' ? (
        <>
          <Drawer.Screen name="TeacherDashboard" component={TeacherDashboard} options={{ title: 'Teacher Portal' }} />
          <Drawer.Screen name="Problems" component={ProblemsScreen} options={{ title: 'Create Problems' }} />
          <Drawer.Screen name="TeacherRankings" component={RankingsScreen} options={{ title: 'Performance Rankings' }} />
          <Drawer.Screen name="TeacherAnalytics" component={GroupAnalyticsScreen} options={{ title: 'Group Analytics', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="GroupCandidates" component={GroupCandidatesScreen} options={{ title: 'Candidates', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="CandidateDetail" component={CandidateDetail} options={{ title: 'Candidate Profile', drawerItemStyle: { display: 'none' } }} />
        </>
      ) : (
        <>
          <Drawer.Screen name="Dashboard" component={CandidateDashboard} options={{ title: 'Dashboard' }} />
          <Drawer.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
          <Drawer.Screen name="MyGroups" component={MyGroupsScreen} options={{ title: 'My Groups' }} />
          <Drawer.Screen name="Progress" component={ProgressScreen} options={{ title: 'My Progress' }} />
          <Drawer.Screen name="Ranking" component={RankingScreen} options={{ title: 'Rankings' }} />
          <Drawer.Screen name="GitHub" component={GitHubScreen} options={{ title: 'GitHub Verification' }} />
          <Drawer.Screen name="LeetCode" component={LeetCodeScreen} options={{ title: 'LeetCode Analytics' }} />
          <Drawer.Screen name="Practice" component={PracticeScreen} options={{ title: 'Practice' }} />
          <Drawer.Screen name="CodingLanguages" component={CodingLanguagesScreen} options={{ title: 'Coding Engine' }} />
          <Drawer.Screen name="CodingEditor" component={CodingEditorScreen} options={{ drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="Interview" component={InterviewScreen} options={{ title: 'AI Mock Interview' }} />
          <Drawer.Screen name="Assignments" component={AssignmentsScreen} options={{ title: 'Group Assignments' }} />
          <Drawer.Screen name="AssignmentTest" component={AssignmentTestScreen} options={{ title: 'Test Mode', drawerItemStyle: { display: 'none' } }} />
          <Drawer.Screen name="Jobs" component={JobsScreen} options={{ title: 'Jobs' }} />
          <Drawer.Screen name="Interviews" component={InterviewsScreen} options={{ title: 'Interviews' }} />
          <Drawer.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
          <Drawer.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
          <Drawer.Screen name="Privacy" component={PrivacyScreen} options={{ title: 'Privacy Settings' }} />
        </>
      )}
    </Drawer.Navigator>
  );
}

import DrawerContent from './src/navigation/DrawerContent';
const Stack = createStackNavigator();

export default function App() {
  const { user } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
            {!user ? (
              <Stack.Screen name="Login" component={LoginScreen} />
            ) : (
              <Stack.Screen name="Main" component={MainDrawer} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
