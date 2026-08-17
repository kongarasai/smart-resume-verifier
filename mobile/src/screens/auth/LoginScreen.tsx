import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ShieldCheck, Eye, EyeOff, User, GraduationCap, BookOpen, Briefcase } from 'lucide-react-native';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/apiClient';

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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8 },
  roleContainer: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 12 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: {
    width: '48%', backgroundColor: '#fff', padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', flexDirection: 'row', gap: 8
  },
  roleCardSelected: { borderColor: '#0f172a', backgroundColor: '#f1f5f9' },
  roleLabel: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  roleLabelSelected: { color: '#0f172a', fontWeight: 'bold' },
  form: { gap: 16 },
  input: { backgroundColor: '#fff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b' },
  passwordContainer: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1, padding: 16, color: '#1e293b' },
  eyeIcon: { padding: 16 },
  button: { backgroundColor: '#0f172a', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  footer: { marginTop: 24, alignItems: 'center' },
  footerText: { color: '#64748b', fontSize: 14 },
  footerLink: { color: '#0f172a', fontWeight: 'bold' }
});
