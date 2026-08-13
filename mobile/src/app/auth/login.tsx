import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../theme/colors';
import { authAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const ROLES = [
  { value: 'candidate', label: 'Candidate', icon: '👤', desc: 'Submit & verify profile' },
  { value: 'mentor', label: 'Mentor', icon: '🎓', desc: 'Create groups & guide' },
  { value: 'teacher', label: 'Teacher', icon: '📚', desc: 'Add problems & notes' },
  { value: 'hr', label: 'HR', icon: '💼', desc: 'Search & evaluate' },
];

const FEATURES = [
  { title: 'GitHub API', desc: 'Real repos & commits' },
  { title: 'LeetCode', desc: 'Live profile data' },
  { title: 'Practice', desc: 'Verified scores' },
  { title: 'Rankings', desc: 'Fair competition' },
];

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'candidate' | 'mentor' | 'teacher' | 'hr'>('candidate');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !fullName)) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await authAPI.register({
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role,
        });

        if (res?.data?.user && res?.data?.token) {
          await setAuth(res.data.user, res.data.token);
          navigateUser(res.data.user.role);
        }
      } else {
        const res = await authAPI.login({
          email: email.trim(),
          password,
        });

        if (res?.data?.user && res?.data?.token) {
          await setAuth(res.data.user, res.data.token);
          navigateUser(res.data.user.role);
        }
      }
    } catch (err: any) {
      console.error('Auth submit error:', err);
      const msg = err.response?.data?.error || err.message || 'Invalid email or password';
      Alert.alert('Authentication Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const navigateUser = (userRole: string) => {
    switch (userRole) {
      case 'mentor':
        router.replace('/mentor');
        break;
      case 'teacher':
        router.replace('/teacher');
        break;
      case 'hr':
        router.replace('/hr');
        break;
      default:
        router.replace('/candidate');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Dark Banner */}
        <View style={styles.darkBanner}>
          <View style={styles.brandRow}>
            <ShieldCheck color={Colors.accent} size={24} />
            <Text style={styles.brandTitle}>ResumeVerify</Text>
          </View>

          <Text style={styles.heroHeading}>Truth behind{'\n'}every resume.</Text>
          <Text style={styles.heroSubtext}>
            Evidence-based verification using real GitHub data, LeetCode statistics, and practice performance.
          </Text>

          <View style={styles.featureGrid}>
            {FEATURES.map((f, idx) => (
              <View key={idx} style={styles.featureBox}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Light Card Container */}
        <View style={styles.lightCard}>
          <Text style={styles.formTitle}>
            {isRegister ? 'Create account' : 'Sign in'}
          </Text>
          <Text style={styles.formSubtitle}>
            {isRegister ? 'Join the platform.' : 'Access your dashboard.'}
          </Text>

          {isRegister && (
            <View style={styles.roleWrapper}>
              <Text style={styles.fieldLabel}>Select Your Role</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const isSelected = role === r.value;
                  return (
                    <TouchableOpacity
                      key={r.value}
                      style={[styles.roleCard, isSelected && styles.roleCardActive]}
                      onPress={() => setRole(r.value as any)}
                    >
                      <Text style={styles.roleIcon}>{r.icon}</Text>
                      <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>
                        {r.label}
                      </Text>
                      <Text style={styles.roleDesc}>{r.desc}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => Alert.alert('Google Sign-In', 'Google Authentication initialized.')}
          >
            <Svg width="20" height="20" viewBox="0 0 48 48">
              <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </Svg>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or email</Text>
            <View style={styles.dividerLine} />
          </View>

          {isRegister && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jane Doe"
                placeholderTextColor="#938d7c"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor="#938d7c"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#938d7c"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff color="#5e5750" size={20} /> : <Eye color="#5e5750" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRegister ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.toggleRow} onPress={() => setIsRegister(!isRegister)}>
            <Text style={styles.toggleText}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={styles.toggleHighlight}>
                {isRegister ? 'Sign in' : 'Create one'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f4f0',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  darkBanner: {
    backgroundColor: '#39352f',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    lineHeight: 34,
    marginBottom: 8,
  },
  heroSubtext: {
    fontSize: 13,
    color: '#b3ae9f',
    lineHeight: 18,
    marginBottom: 16,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureBox: {
    width: '47%',
    borderTopWidth: 1,
    borderTopColor: '#4d4840',
    paddingTop: 8,
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#938d7c',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: '#d1cec3',
  },
  lightCard: {
    backgroundColor: '#f5f4f0',
    borderRadius: 16,
    padding: 16,
  },
  formTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#39352f',
    marginBottom: 2,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#787062',
    marginBottom: 16,
  },
  roleWrapper: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#39352f',
    marginBottom: 6,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#d1cec3',
  },
  roleCardActive: {
    borderColor: '#39352f',
    backgroundColor: '#e8e6df',
  },
  roleIcon: {
    fontSize: 18,
    marginBottom: 4,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#39352f',
  },
  roleLabelActive: {
    color: '#1e1b17',
  },
  roleDesc: {
    fontSize: 10,
    color: '#787062',
    marginTop: 2,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#d1cec3',
    marginBottom: 16,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#39352f',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1cec3',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#787062',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    color: '#39352f',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#d1cec3',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1cec3',
    paddingRight: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#39352f',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#39352f',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleRow: {
    marginTop: 18,
    alignItems: 'center',
  },
  toggleText: {
    color: '#787062',
    fontSize: 14,
  },
  toggleHighlight: {
    color: '#39352f',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
