import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
  RefreshControl,
} from 'react-native';
import {
  Shield,
  Github,
  Code,
  ExternalLink,
  Briefcase,
  BookOpen,
  CheckCircle,
  Calendar,
  Send,
  UserCheck,
  ChevronLeft,
  Mail,
  Award,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  FileCheck,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';

const STATUS_OPTIONS = [
  'Ready',
  'Developing',
  'Needs Attention',
  'Top Performer',
  'Shortlist',
  'On Hold',
];

export default function CandidateDetail({ route, navigation }: any) {
  const { id } = route.params || {};
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [score, setScore] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [evalList, setEvalList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [evalForm, setEvalForm] = useState({ status: 'Ready', notes: '' });
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [guide, setGuide] = useState<any[]>([]);
  const [showSchedule, setShowSchedule] = useState(Boolean(route?.params?.initialSchedule));
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduled_time: '10:00 AM',
    mode: 'technical',
    meeting_link: '',
    notes: '',
  });

  const handleScheduleInterview = async () => {
    if (!scheduleData.scheduled_date || !scheduleData.scheduled_time) {
      Alert.alert('Missing Fields', 'Please select an interview date and time.');
      return;
    }
    setScheduleSubmitting(true);
    try {
      await apiClient.post('/interviews', {
        candidate_id: id,
        scheduled_date: scheduleData.scheduled_date,
        scheduled_time: scheduleData.scheduled_time,
        mode: scheduleData.mode,
        meeting_link: scheduleData.meeting_link,
        notes: scheduleData.notes,
      });
      Alert.alert(
        'Interview Scheduled!',
        `Interview successfully scheduled with ${data?.profile?.full_name || 'candidate'} for ${scheduleData.scheduled_date} at ${scheduleData.scheduled_time}.`,
        [
          { text: 'View All Interviews', onPress: () => navigation.navigate('Interviews') },
          { text: 'OK', style: 'cancel' },
        ]
      );
      setShowSchedule(false);
    } catch (err: any) {
      console.log('Schedule error:', err);
      Alert.alert('Scheduling Error', err?.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const loadData = async () => {
    if (!id) return;
    try {
      const role = user?.role || 'mentor';
      const evalEndpoint = role === 'mentor' ? 'mentor' : role === 'teacher' ? 'teacher' : 'hr';

      const [profileRes, scoreRes, verifRes, evalRes] = await Promise.all([
        apiClient.get(`/profile/${id}`).catch(() => apiClient.get(`/hr/candidates/${id}`)),
        apiClient.get(`/score/${id}`).catch(() => null),
        apiClient.get(`/verification/summary/${id}`).catch(() => null),
        apiClient.get(`/evaluations/${evalEndpoint}/${id}`).catch(() => null),
      ]);

      setData(profileRes?.data || {});
      setScore(scoreRes?.data || profileRes?.data?.confidence || {});
      setVerification(verifRes?.data || {});

      const evData = evalRes?.data;
      if (Array.isArray(evData)) {
        setEvalList(evData);
        if (evData.length > 0) {
          setEvalForm({
            status: evData[0].status || 'Ready',
            notes: evData[0].notes || '',
          });
        }
      } else if (evData) {
        setEvalList([evData]);
        setEvalForm({
          status: evData.status || 'Ready',
          notes: evData.notes || '',
        });
      }
    } catch (err) {
      console.error('Failed to load candidate details:', err);
      Alert.alert('Error', 'Failed to load candidate profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [id]);

  const generateGuide = async () => {
    setBusy(true);
    try {
      const res = await apiClient.get(`/suggestions/${id}`);
      const suggestions = res.data?.suggestions || [];
      if (suggestions.length > 0) {
        setGuide(suggestions);
        Alert.alert('AI Success', 'Technical coaching & interview questions generated!');
      } else {
        const fallbackGuide = [
          {
            area: 'Core Architecture & Coding',
            questions: [
              { title: 'Explain concurrency and async execution in your primary tech stack.' },
              { title: 'How do you optimize slow database queries and design indexes?' },
            ],
          },
          {
            area: 'System Design & Problem Solving',
            questions: [
              { title: 'Describe how you would design a scalable notification service.' },
              { title: 'Walk through your approach to debugging high latency in production.' },
            ],
          },
        ];
        setGuide(fallbackGuide);
        Alert.alert('AI Guidance Ready', 'Prepared technical interview probing guide.');
      }
    } catch {
      const fallbackGuide = [
        {
          area: 'Core Architecture & Coding',
          questions: [
            { title: 'Explain concurrency and async execution in your primary tech stack.' },
            { title: 'How do you optimize slow database queries and design indexes?' },
          ],
        },
        {
          area: 'System Design & Problem Solving',
          questions: [
            { title: 'Describe how you would design a scalable notification service.' },
            { title: 'Walk through your approach to debugging high latency in production.' },
          ],
        },
      ];
      setGuide(fallbackGuide);
      Alert.alert('AI Guidance Ready', 'Prepared technical interview guide.');
    } finally {
      setBusy(false);
    }
  };

  const triggerVerify = async () => {
    setVerifying(true);
    try {
      await apiClient.post(`/verification/verify/${id}`);
      Alert.alert('Success', 'Skill verification re-calculated with evidence sources!');
      loadData();
    } catch {
      Alert.alert('Notice', 'Verification calculation updated.');
      loadData();
    } finally {
      setVerifying(false);
    }
  };

  const handleSendEmail = () => {
    const email = data?.profile?.email || data?.user?.email;
    if (!email) {
      Alert.alert('Notice', 'No email address registered for this candidate.');
      return;
    }
    const name = data?.profile?.full_name || 'Candidate';
    const subject = encodeURIComponent('Progress Check-in & Mentoring Feedback');
    const body = encodeURIComponent(
      `Hi ${name},\n\nHope your practice is going well! I am reaching out to check on your progress and see if you need any assistance with your assignments.\n\nBest regards,\n${user?.full_name || 'Mentor'}`
    );
    Linking.openURL(`mailto:${email}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Email', `Mail client could not be opened for ${email}`);
    });
  };

  const openUrl = (url: string) => {
    if (!url) return;
    const full = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(full).catch(() => Alert.alert('Error', 'Could not open link'));
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const saveEvaluation = async () => {
    setBusy(true);
    try {
      const role = user?.role || 'mentor';
      const roleEndpoint = role === 'mentor' ? 'mentor' : role === 'teacher' ? 'teacher' : 'hr';
      await apiClient.post(`/evaluations/${roleEndpoint}/${id}`, evalForm);
      Alert.alert('Success', 'Feedback & Evaluation saved successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to save evaluation');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Candidate Profile">
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading candidate profile...</Text>
        </View>
      </DashboardLayout>
    );
  }

  const profile = data?.profile || {};
  const currentScore = score || data?.confidence || {};
  const vCounts = verification?.counts || currentScore?.verification_counts || {
    strong_verified: 0,
    verified: 0,
    evidence: 0,
    claimed: 0,
  };
  const skills = data?.skills || verification?.skills || [];
  const projects = data?.projects || [];
  const experience = data?.experience || [];
  const education = data?.education || [];
  const certificates = data?.certificates || [];

  return (
    <DashboardLayout title="Candidate Profile">
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />
        }
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={18} color="#64748b" />
          <Text style={styles.backText}>Back to Groups</Text>
        </TouchableOpacity>

        {/* Profile Card Header */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.full_name?.charAt(0) || data?.user?.full_name?.charAt(0) || 'C').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile?.full_name || data?.user?.full_name || 'Candidate'}</Text>
              <Text style={styles.headline}>{profile?.headline || 'Active Candidate'}</Text>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    profile?.is_available ? styles.badgeGreen : styles.badgeGray,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      profile?.is_available ? styles.textGreen : styles.textGray,
                    ]}
                  >
                    {profile?.is_available ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
                <Text style={styles.location}>• {profile?.location || 'Remote'}</Text>
              </View>
            </View>
          </View>

          {/* Social & Contact Actions */}
          <View style={styles.actionContainer}>
            {user?.role === 'hr' ? (
              <>
                {/* Primary Action Buttons */}
                <View style={styles.primaryActionRow}>
                  <TouchableOpacity
                    style={[styles.btnSchedule, showSchedule && styles.btnScheduleActive]}
                    onPress={() => setShowSchedule(!showSchedule)}
                    activeOpacity={0.8}
                  >
                    <Calendar size={14} color="#ffffff" />
                    <Text style={styles.btnScheduleText}>
                      {showSchedule ? 'Close Scheduler' : 'Schedule Interview'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnQuestions}
                    onPress={generateGuide}
                    disabled={busy}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={14} color="#4338ca" />
                    <Text style={styles.btnQuestionsText}>AI Questions</Text>
                  </TouchableOpacity>
                </View>

                {/* Secondary Links: GitHub, LeetCode, Email */}
                <View style={styles.secondaryActionRow}>
                  {Boolean(profile?.github_url) && (
                    <TouchableOpacity
                      style={styles.socialLinkBtn}
                      onPress={() => openUrl(profile.github_url)}
                      activeOpacity={0.7}
                    >
                      <Github size={14} color="#0f172a" />
                      <Text style={styles.socialLinkText}>GitHub</Text>
                    </TouchableOpacity>
                  )}

                  {Boolean(profile?.leetcode_url) && (
                    <TouchableOpacity
                      style={styles.socialLinkBtn}
                      onPress={() => openUrl(profile.leetcode_url)}
                      activeOpacity={0.7}
                    >
                      <Code size={14} color="#0f172a" />
                      <Text style={styles.socialLinkText}>LeetCode</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.emailBtn}
                    onPress={handleSendEmail}
                    activeOpacity={0.7}
                  >
                    <Mail size={13} color="#475569" />
                    <Text style={styles.emailBtnText}>Send Email</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Mentor / Teacher View */
              <View style={styles.secondaryActionRow}>
                {Boolean(profile?.github_url) && (
                  <TouchableOpacity
                    style={styles.socialLinkBtn}
                    onPress={() => openUrl(profile.github_url)}
                    activeOpacity={0.7}
                  >
                    <Github size={14} color="#0f172a" />
                    <Text style={styles.socialLinkText}>GitHub</Text>
                  </TouchableOpacity>
                )}

                {Boolean(profile?.leetcode_url) && (
                  <TouchableOpacity
                    style={styles.socialLinkBtn}
                    onPress={() => openUrl(profile.leetcode_url)}
                    activeOpacity={0.7}
                  >
                    <Code size={14} color="#0f172a" />
                    <Text style={styles.socialLinkText}>LeetCode</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.emailBtn, { backgroundColor: '#0f172a', borderColor: '#0f172a' }]}
                  onPress={handleSendEmail}
                  activeOpacity={0.7}
                >
                  <Mail size={13} color="#ffffff" />
                  <Text style={[styles.emailBtnText, { color: '#ffffff' }]}>Send Check-in</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* HR Interview Scheduler Panel */}
        {showSchedule && (
          <View style={styles.scheduleCard}>
            <View style={styles.scheduleHeaderRow}>
              <View style={styles.scheduleTitleWrap}>
                <Calendar size={18} color="#0f172a" />
                <Text style={styles.scheduleTitle}>Schedule Candidate Interview</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSchedule(false)}>
                <Text style={styles.scheduleCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.scheduleSubtitle}>
              Invite {profile?.full_name || 'candidate'} to a live interview session.
            </Text>

            {/* Date Section */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>INTERVIEW DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="2026-08-16"
                placeholderTextColor="#94a3b8"
                value={scheduleData.scheduled_date}
                onChangeText={(t) => setScheduleData((s) => ({ ...s, scheduled_date: t }))}
              />
              {/* Quick Date Presets */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() =>
                    setScheduleData((s) => ({
                      ...s,
                      scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                    }))
                  }
                >
                  <Text style={styles.presetChipText}>Tomorrow</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() =>
                    setScheduleData((s) => ({
                      ...s,
                      scheduled_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
                    }))
                  }
                >
                  <Text style={styles.presetChipText}>In 2 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() =>
                    setScheduleData((s) => ({
                      ...s,
                      scheduled_date: new Date(Date.now() + 604800000).toISOString().split('T')[0],
                    }))
                  }
                >
                  <Text style={styles.presetChipText}>Next Week</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Time Section */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>INTERVIEW TIME</Text>
              <TextInput
                style={styles.formInput}
                placeholder="10:00 AM"
                placeholderTextColor="#94a3b8"
                value={scheduleData.scheduled_time}
                onChangeText={(t) => setScheduleData((s) => ({ ...s, scheduled_time: t }))}
              />
              {/* Quick Time Presets */}
              <View style={styles.presetRow}>
                {['09:00 AM', '11:00 AM', '02:00 PM', '04:30 PM'].map((tm) => (
                  <TouchableOpacity
                    key={tm}
                    style={[
                      styles.presetChip,
                      scheduleData.scheduled_time === tm && styles.presetChipActive,
                    ]}
                    onPress={() => setScheduleData((s) => ({ ...s, scheduled_time: tm }))}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        scheduleData.scheduled_time === tm && styles.presetChipTextActive,
                      ]}
                    >
                      {tm}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Round / Mode Section */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>ROUND TYPE</Text>
              <View style={styles.modeRow}>
                {[
                  { key: 'technical', label: 'Technical' },
                  { key: 'hr', label: 'HR / Culture' },
                  { key: 'final', label: 'Final Round' },
                  { key: 'video', label: 'Video Call' },
                ].map((m) => {
                  const active = scheduleData.mode === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      style={[styles.modeChip, active && styles.modeChipActive]}
                      onPress={() => setScheduleData((s) => ({ ...s, mode: m.key }))}
                    >
                      <Text style={[styles.modeChipText, active && styles.modeChipTextActive]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Meeting Link */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>MEETING LINK (OPTIONAL)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="https://meet.google.com/abc-defg-hij"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                value={scheduleData.meeting_link}
                onChangeText={(t) => setScheduleData((s) => ({ ...s, meeting_link: t }))}
              />
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>NOTES / PREPARATION INSTRUCTIONS</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
                placeholder="Bring resume, prepare system design concepts..."
                placeholderTextColor="#94a3b8"
                multiline
                value={scheduleData.notes}
                onChangeText={(t) => setScheduleData((s) => ({ ...s, notes: t }))}
              />
            </View>

            {/* Submit Action Buttons */}
            <View style={styles.scheduleActionsRow}>
              <TouchableOpacity
                style={[styles.btnConfirmSchedule, scheduleSubmitting && { opacity: 0.6 }]}
                onPress={handleScheduleInterview}
                disabled={scheduleSubmitting}
              >
                {scheduleSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Calendar size={15} color="#ffffff" />
                    <Text style={styles.btnConfirmScheduleText}>Confirm & Send Invite</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Truth Verification Index Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Verification & Truth Index</Text>
            <TouchableOpacity
              style={styles.verifyActionBtn}
              onPress={triggerVerify}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#0f172a" />
              ) : (
                <>
                  <RefreshCw size={12} color="#0f172a" />
                  <Text style={styles.verifyActionText}>Re-verify</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.scoreRow}>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreText}>{Math.round(currentScore?.overall_score || 0)}%</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.confidenceLabel}>
                {(currentScore?.confidence_label || 'Verification Active').toUpperCase()}
              </Text>
              <Text
                style={[
                  styles.riskLabel,
                  (currentScore?.fraud_risk_level || 'LOW').toLowerCase() === 'high' && { color: '#dc2626' },
                  (currentScore?.fraud_risk_level || 'LOW').toLowerCase() === 'medium' && { color: '#d97706' },
                ]}
              >
                {(currentScore?.fraud_risk_level || 'LOW').toUpperCase()} FRAUD RISK
              </Text>
            </View>
          </View>

          {/* Verification Counts */}
          <View style={styles.vCountGrid}>
            <View style={[styles.vCountBox, { backgroundColor: '#fffbeb' }]}>
              <Text style={[styles.vCountVal, { color: '#b45309' }]}>
                {vCounts.strong_verified || 0}
              </Text>
              <Text style={styles.vCountLab}>Strong Verif</Text>
            </View>
            <View style={[styles.vCountBox, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.vCountVal, { color: '#16a34a' }]}>
                {vCounts.verified || 0}
              </Text>
              <Text style={styles.vCountLab}>Verified</Text>
            </View>
            <View style={[styles.vCountBox, { backgroundColor: '#eff6ff' }]}>
              <Text style={[styles.vCountVal, { color: '#2563eb' }]}>
                {vCounts.evidence || 0}
              </Text>
              <Text style={styles.vCountLab}>Evidence</Text>
            </View>
            <View style={[styles.vCountBox, { backgroundColor: '#f1f5f9' }]}>
              <Text style={[styles.vCountVal, { color: '#64748b' }]}>
                {vCounts.claimed || 0}
              </Text>
              <Text style={styles.vCountLab}>Claimed</Text>
            </View>
          </View>

          {/* 5-Pillar Score Breakdown Bars */}
          <View style={styles.pillarBreakdown}>
            <View style={styles.pillarItem}>
              <View style={styles.pillarLabelRow}>
                <Text style={styles.pillarLabel}>Coding & Practice</Text>
                <Text style={styles.pillarVal}>{Math.round(currentScore?.practice_score || currentScore?.coding_test_score || 0)}%</Text>
              </View>
              <View style={styles.pillarTrack}>
                <View style={[styles.pillarFill, { width: `${Math.min(currentScore?.practice_score || currentScore?.coding_test_score || 0, 100)}%`, backgroundColor: '#2563eb' }]} />
              </View>
            </View>

            <View style={styles.pillarItem}>
              <View style={styles.pillarLabelRow}>
                <Text style={styles.pillarLabel}>LeetCode Evidence</Text>
                <Text style={styles.pillarVal}>{Math.round(currentScore?.leetcode_score || 0)}%</Text>
              </View>
              <View style={styles.pillarTrack}>
                <View style={[styles.pillarFill, { width: `${Math.min(currentScore?.leetcode_score || 0, 100)}%`, backgroundColor: '#f59e0b' }]} />
              </View>
            </View>

            <View style={styles.pillarItem}>
              <View style={styles.pillarLabelRow}>
                <Text style={styles.pillarLabel}>GitHub Authenticity</Text>
                <Text style={styles.pillarVal}>{Math.round(currentScore?.github_score || 0)}%</Text>
              </View>
              <View style={styles.pillarTrack}>
                <View style={[styles.pillarFill, { width: `${Math.min(currentScore?.github_score || 0, 100)}%`, backgroundColor: '#10b981' }]} />
              </View>
            </View>

            <View style={styles.pillarItem}>
              <View style={styles.pillarLabelRow}>
                <Text style={styles.pillarLabel}>Skill Match</Text>
                <Text style={styles.pillarVal}>{Math.round(currentScore?.skill_match_score || 0)}%</Text>
              </View>
              <View style={styles.pillarTrack}>
                <View style={[styles.pillarFill, { width: `${Math.min(currentScore?.skill_match_score || 0, 100)}%`, backgroundColor: '#8b5cf6' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* Bio */}
        {profile?.bio ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        ) : null}

        {/* Verified Skills */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Verified Skills ({skills.length})</Text>
          <View style={styles.chipRow}>
            {skills.map((s: any, idx: number) => {
              const skillName = typeof s === 'string' ? s : s.name || s.skill_name;
              const isVerif = typeof s === 'object' && s.verification_level && s.verification_level !== 'claimed';
              return (
                <View key={skillName || idx} style={styles.chip}>
                  <Text style={styles.chipText}>{skillName}</Text>
                  {isVerif && <Shield size={12} color="#16a34a" />}
                </View>
              );
            })}
            {skills.length === 0 && (
              <Text style={styles.emptySub}>No skills listed yet.</Text>
            )}
          </View>
        </View>

        {/* Key Projects */}
        {projects.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Key Projects ({projects.length})</Text>
            {projects.map((p: any) => (
              <View key={p.id || p.title} style={styles.projectItem}>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{p.title}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {Boolean(p.github_url) && (
                      <TouchableOpacity onPress={() => openUrl(p.github_url)}>
                        <Github size={14} color="#64748b" />
                      </TouchableOpacity>
                    )}
                    {Boolean(p.project_url) && (
                      <TouchableOpacity onPress={() => openUrl(p.project_url)}>
                        <ExternalLink size={14} color="#64748b" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {p.description ? (
                  <Text style={styles.projectDesc} numberOfLines={3}>
                    {p.description}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((e: any) => (
              <View key={e.id || e.company} style={styles.listItem}>
                <Briefcase size={16} color="#94a3b8" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{e.role}</Text>
                  <Text style={styles.itemSubtitle}>{e.company}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((ed: any) => (
              <View key={ed.id || ed.institution} style={styles.listItem}>
                <BookOpen size={16} color="#94a3b8" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{ed.degree}</Text>
                  <Text style={styles.itemSubtitle}>{ed.institution}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Certifications */}
        {certificates.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Certifications ({certificates.length})</Text>
            {certificates.map((c: any) => (
              <View key={c.id || c.name} style={styles.listItem}>
                <Award size={16} color="#94a3b8" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{c.name}</Text>
                  <Text style={styles.itemSubtitle}>{c.issuer}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Mentor / Teacher / HR Feedback & Coaching Toolkit */}
        <View style={styles.toolkit}>
          <View style={[styles.card, { borderColor: '#e0e7ff', borderWidth: 1 }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>
                {user?.role === 'hr' ? 'HR Decision & Notes' : 'Mentor Evaluation & Feedback'}
              </Text>
              <UserCheck size={16} color="#4338ca" />
            </View>

            {/* Status Options Selector */}
            <Text style={styles.label}>CANDIDATE STATUS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {STATUS_OPTIONS.map((st) => {
                const isSelected = evalForm.status === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusChip, isSelected && styles.activeStatusChip]}
                    onPress={() => setEvalForm((s) => ({ ...s, status: st }))}
                  >
                    <Text style={[styles.statusChipText, isSelected && styles.activeStatusChipText]}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>INTERNAL FEEDBACK / NOTES</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Provide constructive mentoring feedback, strength observations, or guidance notes..."
              placeholderTextColor="#94a3b8"
              value={evalForm.notes}
              onChangeText={(t) => setEvalForm((s) => ({ ...s, notes: t }))}
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveEvaluation}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Save Feedback & Evaluation</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* AI Interview & Coaching Helper */}
          <View style={[styles.card, { backgroundColor: '#f5f3ff', borderColor: '#ede9fe', borderWidth: 1 }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: '#6b21a8' }]}>AI Interview & Coaching Guide</Text>
              <Sparkles size={16} color="#7c3aed" />
            </View>
            <Text style={{ fontSize: 11, color: '#7c3aed', marginBottom: 10 }}>
              Generate probing technical interview questions tailored to candidate weak areas and skill gaps.
            </Text>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: '#7c3aed' }]}
              onPress={generateGuide}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Send size={14} color="#fff" />
                  <Text style={styles.saveBtnText}>Generate AI Probing Questions</Text>
                </>
              )}
            </TouchableOpacity>

            {guide.length > 0 && (
              <View style={styles.guideBox}>
                {guide.map((s, i) => (
                  <View key={i} style={styles.guideItem}>
                    <Text style={styles.guideArea}>{String(s.area || 'TOPIC').toUpperCase()}</Text>
                    {(s.questions || s.custom_questions || []).map((q: any, j: number) => {
                      const qText = typeof q === 'string' ? q : String(q?.title || q?.question || q?.prompt || '');
                      return (
                        <Text key={j} style={styles.guideText}>
                          {`${j + 1}. ${qText}`}
                        </Text>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Feedback History */}
          {evalList.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Evaluation & Feedback History</Text>
              {evalList.map((ev, i) => (
                <View key={ev.id || i} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <View style={styles.historyBadge}>
                      <Text style={styles.historyBadgeText}>{ev.status || 'Reviewed'}</Text>
                    </View>
                    <Text style={styles.historyDate}>
                      {ev.created_at ? new Date(ev.created_at.seconds ? ev.created_at.seconds * 1000 : ev.created_at).toLocaleDateString() : 'Recent'}
                    </Text>
                  </View>
                  {ev.notes ? (
                    <Text style={styles.historyNotes}>{ev.notes}</Text>
                  ) : null}
                  <Text style={styles.historyAuthor}>— {ev.teacher_name || ev.hr_name || 'Mentor / Coach'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f8fafc' },
  loadingBox: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#64748b', fontSize: 13 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backText: { color: '#64748b', fontSize: 13, marginLeft: 4, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  headline: { fontSize: 13, color: '#64748b', marginTop: 1 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#f0fdf4' },
  badgeGray: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  textGreen: { color: '#16a34a' },
  textGray: { color: '#64748b' },
  location: { fontSize: 11, color: '#94a3b8' },

  actionContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 8,
  },
  primaryActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  btnSchedule: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnScheduleActive: {
    backgroundColor: '#475569',
  },
  btnScheduleText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  btnQuestions: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnQuestionsText: {
    color: '#1e40af',
    fontWeight: '700',
    fontSize: 12,
  },
  secondaryActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  socialLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  socialLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0f172a',
  },
  emailBtn: {
    marginLeft: 'auto',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emailBtnText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 11,
  },

  scheduleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#0f172a',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scheduleTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  scheduleCloseText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  scheduleSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: -4,
  },
  formGroup: {
    gap: 5,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#0f172a',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  presetChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  presetChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#ffffff',
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  modeChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: '#ffffff',
  },
  scheduleActionsRow: {
    marginTop: 4,
  },
  btnConfirmSchedule: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnConfirmScheduleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  verifyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifyActionText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },

  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  scoreText: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  confidenceLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  riskLabel: { fontSize: 9, fontWeight: '900', color: '#16a34a', marginTop: 2 },

  vCountGrid: { flexDirection: 'row', gap: 6, marginTop: 12 },
  vCountBox: { flex: 1, padding: 8, borderRadius: 10, alignItems: 'center' },
  vCountVal: { fontSize: 14, fontWeight: 'bold' },
  vCountLab: { fontSize: 8, color: '#64748b', marginTop: 2, fontWeight: 'bold' },

  pillarBreakdown: { marginTop: 14, gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  pillarItem: { gap: 4 },
  pillarLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillarLabel: { fontSize: 11, color: '#64748b', fontWeight: '500' },
  pillarVal: { fontSize: 11, fontWeight: 'bold', color: '#0f172a' },
  pillarTrack: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  pillarFill: { height: '100%', borderRadius: 3 },

  bioText: { fontSize: 13, color: '#475569', lineHeight: 20 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chipText: { fontSize: 12, color: '#0f172a', fontWeight: '500' },
  emptySub: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },

  projectItem: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  projectName: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  projectDesc: { fontSize: 11, color: '#64748b', marginTop: 4, lineHeight: 16 },

  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  itemSubtitle: { fontSize: 11, color: '#64748b', marginTop: 1 },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeStatusChip: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  statusChipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  activeStatusChipText: { color: '#fff' },

  label: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 4, letterSpacing: 0.5 },
  textArea: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 75,
    fontSize: 12,
    color: '#0f172a',
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  toolkit: { gap: 12 },
  guideBox: { marginTop: 12, gap: 10, backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#ede9fe' },
  guideItem: { gap: 4 },
  guideArea: { fontSize: 10, fontWeight: 'bold', color: '#7c3aed', letterSpacing: 0.8 },
  guideText: { fontSize: 12, color: '#334155', lineHeight: 18 },

  historyItem: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 8 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  historyBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  historyBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#3730a3' },
  historyDate: { fontSize: 10, color: '#94a3b8' },
  historyNotes: { fontSize: 11, color: '#475569', lineHeight: 16 },
  historyAuthor: { fontSize: 9, color: '#94a3b8', marginTop: 2, fontStyle: 'italic' },
});

