import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { ShieldCheck, Eye, EyeOff, User, GraduationCap, BookOpen, Briefcase, X } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/apiClient';

const GoogleIcon = ({ size = 20 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <Path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <Path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <Path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </Svg>
);

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const btoaPolyfill = (input: string) => {
  let str = input;
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars;
       str.charAt(i | 0) || (map = '=', i % 1);
       output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3 / 4);
    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
};

const base64UrlEncode = (str: string) => {
  return btoaPolyfill(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const generateMockFirebaseToken = (email: string, name: string) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const uid = email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
  const payload = {
    uid,
    user_id: uid,
    sub: uid,
    email: email.toLowerCase(),
    name: name || email.split('@')[0],
  };
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}.mocksignature`;
};

const ROLES = [
  { value: 'candidate', label: 'Candidate', icon: User, desc: 'Submit profile' },
  { value: 'mentor', label: 'Mentor', icon: GraduationCap, desc: 'Create groups' },
  { value: 'teacher', label: 'Teacher', icon: BookOpen, desc: 'Add problems' },
  { value: 'hr', label: 'HR', icon: Briefcase, desc: 'Search & hire' },
];

export default function LoginScreen({ navigation }: any) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [role, setRole] = useState('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const { setAuth } = useAuthStore();

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login';
      const payload = isRegister
        ? { email, password, full_name: fullName, role }
        : { email, password };

      const mockToken = generateMockFirebaseToken(email, fullName || email.split('@')[0]);

      const res = await apiClient.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${mockToken}`
        }
      });
      setAuth(res.data.user, res.data.token);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Authentication failed';
      console.warn('Auth notice:', errMsg);
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuthExecute = async (gEmail: string, gName?: string) => {
    const cleanEmail = (gEmail || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Please enter a valid Google email address.');
      return;
    }

    setGoogleLoading(true);
    setGoogleModalVisible(false);

    try {
      const resolvedName = gName || cleanEmail.split('@')[0].replace(/[._]/g, ' ');
      const mockToken = generateMockFirebaseToken(cleanEmail, resolvedName);

      if (isRegister) {
        try {
          const regRes = await apiClient.post(
            '/auth/register',
            { email: cleanEmail, full_name: resolvedName, role },
            { headers: { Authorization: `Bearer ${mockToken}` } }
          );
          setAuth(regRes.data.user, regRes.data.token);
          return;
        } catch (regErr: any) {
          // If already exists, proceed to login
          const loginRes = await apiClient.post(
            '/auth/login',
            { email: cleanEmail },
            { headers: { Authorization: `Bearer ${mockToken}` } }
          );
          setAuth(loginRes.data.user, loginRes.data.token);
          return;
        }
      } else {
        try {
          const loginRes = await apiClient.post(
            '/auth/login',
            { email: cleanEmail },
            { headers: { Authorization: `Bearer ${mockToken}` } }
          );
          setAuth(loginRes.data.user, loginRes.data.token);
        } catch (loginErr: any) {
          // If candidate user not registered yet, auto-register as candidate
          const regRes = await apiClient.post(
            '/auth/register',
            { email: cleanEmail, full_name: resolvedName, role: 'candidate' },
            { headers: { Authorization: `Bearer ${mockToken}` } }
          );
          setAuth(regRes.data.user, regRes.data.token);
        }
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Google authentication failed';
      console.warn('Google Auth notice:', errMsg);
      alert(errMsg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const onGoogleButtonPress = () => {
    if (email && email.includes('@')) {
      handleGoogleAuthExecute(email, fullName);
    } else {
      setGoogleCustomEmail(email || '');
      setGoogleModalVisible(true);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <ShieldCheck size={40} color="#0f172a" />
          <Text style={styles.title}>{isRegister ? 'Create Account' : 'Welcome Back'}</Text>
          <Text style={styles.subtitle}>{isRegister ? 'Join the platform.' : 'Access your dashboard.'}</Text>
        </View>

        {isRegister && (
          <View style={styles.roleContainer}>
            <Text style={styles.label}>Select Your Role</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.roleCard, role === r.value && styles.roleCardSelected]}
                  onPress={() => setRole(r.value)}
                >
                  <r.icon size={20} color={role === r.value ? '#0f172a' : '#64748b'} />
                  <Text style={[styles.roleLabel, role === r.value && styles.roleLabelSelected]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── Continue with Google Button ── */}
        <TouchableOpacity
          style={styles.googleButton}
          onPress={onGoogleButtonPress}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color="#0f172a" />
          ) : (
            <>
              <GoogleIcon size={20} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with email</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.form}>
          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
            />
          )}
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeIcon}>
              {showPass ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isRegister ? 'Create Account' : 'Sign In'}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.footer}>
          <Text style={styles.footerText}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={styles.footerLink}>{isRegister ? 'Sign In' : 'Create One'}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Google Sign In Modal Sheet ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={googleModalVisible}
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <GoogleIcon size={24} />
                <Text style={styles.modalTitle}>Google Sign-In</Text>
              </View>
              <TouchableOpacity onPress={() => setGoogleModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Sign in or create your account using your Google address:
            </Text>

            <TextInput
              style={styles.googleInput}
              placeholder="yourname@gmail.com"
              value={googleCustomEmail}
              onChangeText={setGoogleCustomEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoFocus
            />

            <View style={styles.quickOptions}>
              <Text style={styles.quickLabel}>Quick Accounts:</Text>
              <TouchableOpacity
                style={styles.quickPill}
                onPress={() => setGoogleCustomEmail('candidate.demo@gmail.com')}
              >
                <Text style={styles.quickPillText}>candidate.demo@gmail.com</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickPill}
                onPress={() => setGoogleCustomEmail('hr.recruiter@gmail.com')}
              >
                <Text style={styles.quickPillText}>hr.recruiter@gmail.com</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.googleSubmitBtn}
              onPress={() => handleGoogleAuthExecute(googleCustomEmail)}
            >
              <Text style={styles.googleSubmitText}>Sign In with this Google Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 6 },
  roleContainer: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 12 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: {
    width: '48%', backgroundColor: '#fff', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', flexDirection: 'row', gap: 8
  },
  roleCardSelected: { borderColor: '#0f172a', backgroundColor: '#f1f5f9' },
  roleLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  roleLabelSelected: { color: '#0f172a', fontWeight: 'bold' },
  googleButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  form: { gap: 16 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b' },
  passwordContainer: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, padding: 16, color: '#1e293b' },
  eyeIcon: { padding: 16 },
  button: { backgroundColor: '#0f172a', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#0f172a', fontWeight: 'bold' },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  googleInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 14,
  },
  quickOptions: {
    marginBottom: 20,
  },
  quickLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  quickPill: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  quickPillText: {
    fontSize: 13,
    color: '#334155',
  },
  googleSubmitBtn: {
    backgroundColor: '#4285F4',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  googleSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
