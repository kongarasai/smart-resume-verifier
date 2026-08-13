import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';
import { Colors } from '../theme/colors';

export default function RootLayout() {
  const { initFromStorage } = useAuthStore();

  useEffect(() => {
    initFromStorage();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={Colors.ink[950]} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="candidate/index" />
        <Stack.Screen name="mentor/index" />
        <Stack.Screen name="teacher/index" />
        <Stack.Screen name="hr/index" />
      </Stack>
    </>
  );
}
