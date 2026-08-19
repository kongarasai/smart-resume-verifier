import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import { Shield, ShieldCheck, RefreshCw, Upload, FileText, Plus, Trash2, ExternalLink, Eye, Briefcase, BookOpen, Star, X, MessageSquare, AlertCircle, CheckCircle, Award } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';

type Tab = 'overview' | 'skills' | 'projects' | 'education' | 'experience' | 'certificates' | 'feedback';

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [score, setScore] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [timeline, setTimeline] = useState<any[]>([]);

  // Profile Form States
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [leetcodeUrl, setLeetcodeUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Modal States
  const [hvModalVisible, setHvModalVisible] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [evidenceData, setEvidenceData] = useState<any>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);
  const [evidenceModalVisible, setEvidenceModalVisible] = useState(false);

  // Add Item Modals
  const [projectModalVisible, setProjectModalVisible] = useState(false);
  const [experienceModalVisible, setExperienceModalVisible] = useState(false);
  const [educationModalVisible, setEducationModalVisible] = useState(false);
  const [certificateModalVisible, setCertificateModalVisible] = useState(false);

  // Add Item Form States
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');

  const [pTitle, setPTitle] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pGithub, setPGithub] = useState('');
  const [pDemo, setPDemo] = useState('');
  const [pTech, setPTech] = useState('');

  const [expRole, setExpRole] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLoc, setExpLoc] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const [eduInst, setEduInst] = useState('');
  const [eduDegree, setEduDegree] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStart, setEduStart] = useState('');
  const [eduEnd, setEduEnd] = useState('');

  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');
  const [certUrl, setCertUrl] = useState('');

  const loadData = async () => {
    try {
      const [pRes, tRes, sRes, vRes] = await Promise.all([
        apiClient.get('/profile'),
        apiClient.get('/profile/timeline'),
        apiClient.get('/score').catch(() => null),
        apiClient.get('/verification/summary').catch(() => null)
      ]);
      const profileData = pRes.data;
      setData(profileData);
      setTimeline(tRes.data || []);
      setScore(sRes?.data || null);
      setVerification(vRes?.data || null);

      if (profileData?.profile) {
        const p = profileData.profile;
        setHeadline(p.headline || '');
        setBio(p.bio || '');
        setPhone(p.phone || '');
        setLocation(p.location || '');
        setYearsExperience(p.years_experience ? String(p.years_experience) : '');
        setGithubUrl(p.github_url || '');
        setLeetcodeUrl(p.leetcode_url || '');
        setIsAvailable(p.is_available !== false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleParse = async () => {
    setParsing(true);
    try {
      await apiClient.post('/resume/parse');
      Alert.alert('Success', 'Resume parsed and profile updated!');
      loadData();
    } catch {
      Alert.alert('Error', 'Parsing failed. Ensure resume is uploaded.');
    } finally { setParsing(false); }
  };

  const handleUploadResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const fileAsset = result.assets[0];
      const formData = new FormData();
      formData.append('resume', {
        uri: fileAsset.uri,
        name: fileAsset.name || 'resume.pdf',
        type: fileAsset.mimeType || 'application/pdf',
      } as any);

      Alert.alert('Uploading', 'Uploading resume, please wait...');
      await apiClient.post('/profile/resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'Resume uploaded successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Upload failed');
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiClient.put('/profile', {
        headline,
        bio,
        phone,
        location,
        years_experience: Number(yearsExperience) || 0,
        github_url: githubUrl,
        leetcode_url: leetcodeUrl
      });
      Alert.alert('Success', 'Profile updated successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Save failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleAvailability = async () => {
    const next = !isAvailable;
    try {
      await apiClient.put('/profile/availability', { is_available: next });
      setIsAvailable(next);
      Alert.alert('Success', `Availability updated to: ${next ? 'Available' : 'Unavailable'}`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to update availability status.');
    }
  };

  const showEvidence = async (skillName: string) => {
    setSelectedSkill(skillName);
    setLoadingEvidence(true);
    setEvidenceModalVisible(true);
    try {
      const res = await apiClient.get(`/verification/skill/${skillName}`);
      setEvidenceData(res.data);
    } catch {
      setEvidenceData(null);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const fetchFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const res = await apiClient.get('/profile/resume-feedback');
      setFeedback(res.data);
    } catch {
    } finally {
      setLoadingFeedback(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tab === 'feedback' && !feedback) fetchFeedback();
  }, [tab]);

  const runVerification = async () => {
    setVerifying(true);
    try {
      await apiClient.post('/verification/run');
      Alert.alert('Success', 'Skill verification complete!');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Verification failed');
    } finally { setVerifying(false); }
  };

  const calcScore = async () => {
    setCalculating(true);
    try {
      await apiClient.post('/score/calculate');
      Alert.alert('Success', 'Verification score recalculated!');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Calculation failed');
    } finally { setCalculating(false); }
  };

  // Add Item Actions
  const handleAddSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      await apiClient.post('/skills', { name: newSkillName.trim(), source: 'manual', proficiency_level: newSkillLevel });
      setNewSkillName('');
      loadData();
      Alert.alert('Success', 'Skill added');
    } catch { Alert.alert('Error', 'Failed to add skill'); }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await apiClient.delete(`/skills/${id}`);
      loadData();
      Alert.alert('Success', 'Skill deleted');
    } catch { Alert.alert('Error', 'Failed to delete skill'); }
  };

  const handleAddProject = async () => {
    if (!pTitle.trim() || !pDesc.trim()) return;
    try {
      const techArray = pTech.split(',').map(s => s.trim()).filter(Boolean);
      await apiClient.post('/projects', { title: pTitle, description: pDesc, project_url: pDemo, github_url: pGithub, technologies: techArray });
      setPTitle(''); setPDesc(''); setPGithub(''); setPDemo(''); setPTech('');
      setProjectModalVisible(false);
      loadData();
      Alert.alert('Success', 'Project added');
    } catch { Alert.alert('Error', 'Failed to add project'); }
  };

  const handleAddExperience = async () => {
    if (!expRole.trim() || !expCompany.trim()) return;
    try {
      await apiClient.post('/experience', { role: expRole, company: expCompany, location: expLoc, start_date: expStart, end_date: expEnd, description: expDesc });
      setExpRole(''); setExpCompany(''); setExpLoc(''); setExpStart(''); setExpEnd(''); setExpDesc('');
      setExperienceModalVisible(false);
      loadData();
      Alert.alert('Success', 'Experience added');
    } catch { Alert.alert('Error', 'Failed to add experience'); }
  };

  const handleAddEducation = async () => {
    if (!eduInst.trim() || !eduDegree.trim()) return;
    try {
      await apiClient.post('/education', { institution: eduInst, degree: eduDegree, field_of_study: eduField, start_year: Number(eduStart), end_year: Number(eduEnd) });
      setEduInst(''); setEduDegree(''); setEduField(''); setEduStart(''); setEduEnd('');
      setEducationModalVisible(false);
      loadData();
      Alert.alert('Success', 'Education added');
    } catch { Alert.alert('Error', 'Failed to add education'); }
  };

  const handleAddCertificate = async () => {
    if (!certName.trim() || !certIssuer.trim()) return;
    try {
      await apiClient.post('/certificates', { name: certName, issuer: certIssuer, issue_date: certDate, credential_url: certUrl });
      setCertName(''); setCertIssuer(''); setCertDate(''); setCertUrl('');
      setCertificateModalVisible(false);
      loadData();
      Alert.alert('Success', 'Certificate added');
    } catch { Alert.alert('Error', 'Failed to add certificate'); }
  };

  if (loading) return <DashboardLayout title="Profile"><ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} /></DashboardLayout>;

  const profile = data?.profile;
  const vCounts = verification?.counts || {};
  const hiringStatus = data?.hiring_status || [];

  const getHVStatusText = () => {
    if (!hiringStatus || hiringStatus.length === 0) return 'PENDING';
    if (hiringStatus.some((s: any) => s.status === 'shortlisted')) return 'SHORTLISTED';
    if (hiringStatus.some((s: any) => s.status === 'hold')) return 'HOLD';
    if (hiringStatus.some((s: any) => s.status === 'rejected')) return 'REJECTED';
    return hiringStatus[0].status.toUpperCase();
  };

  const getHVStatusColor = () => {
    const status = getHVStatusText();
    if (status === 'SHORTLISTED') return '#7c3aed';
    if (status === 'HOLD') return '#ea580c';
    if (status === 'REJECTED') return '#dc2626';
    return '#64748b';
  };

  return (
    <DashboardLayout title="My Profile">
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.headerCard}>
          <View style={styles.profileInfoRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile?.full_name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{profile?.full_name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={styles.badgeRow}>
                <TouchableOpacity onPress={toggleAvailability} style={[styles.availabilityBadge, isAvailable ? styles.badgeGreen : styles.badgeGray]}>
                  <View style={[styles.dot, { backgroundColor: isAvailable ? '#10b981' : '#64748b' }]} />
                  <Text style={isAvailable ? styles.textGreen : styles.textGray}>
                    {isAvailable ? 'Available' : 'Not Available'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setHvModalVisible(true)} style={[styles.hvBadge, { backgroundColor: getHVStatusColor() + '1A', borderColor: getHVStatusColor() }]}>
                  <Star size={10} color={getHVStatusColor()} fill={getHVStatusText() === 'SHORTLISTED' ? getHVStatusColor() : 'none'} />
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: getHVStatusColor() }}>
                    HV: {getHVStatusText()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnSecondary} onPress={runVerification} disabled={verifying}>
              {verifying ? <ActivityIndicator size="small" color="#0f172a" /> : <Shield size={16} color="#0f172a" />}
              <Text style={styles.btnTextSecondary}>{verifying ? 'Verifying...' : 'Verify'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={calcScore} disabled={calculating}>
              {calculating ? <ActivityIndicator size="small" color="#fff" /> : <RefreshCw size={16} color="#fff" />}
              <Text style={styles.btnTextPrimary}>Recalculate</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Verification Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Strong', count: vCounts.strong_verified || 0, color: '#92400e', bg: '#fdf8f0' },
            { label: 'Verified', count: vCounts.verified || 0, color: '#166534', bg: '#f0faf5' },
            { label: 'Evidence', count: vCounts.evidence || 0, color: '#1e40af', bg: '#eff6ff' },
            { label: 'Claimed', count: vCounts.claimed || 0, color: '#78716c', bg: '#f5f4f0' },
          ].map((item, idx) => (
            <View key={idx} style={[styles.statCard, { backgroundColor: item.bg }]}>
              <Text style={[styles.statCount, { color: item.color }]}>{item.count}</Text>
              <Text style={[styles.statLabel, { color: item.color }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
          {['overview', 'feedback', 'skills', 'projects', 'experience', 'education', 'certificates'].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t as Tab)}
              style={[styles.tabItem, tab === t && styles.activeTabItem]}
            >
              <Text style={[styles.tabLabel, tab === t && styles.activeTabLabel]}>{t.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Content */}
        <View style={styles.content}>
          {tab === 'overview' && (
            <View style={styles.overview}>
              {/* Confidence Meter Card */}
              {score && (
                <View style={styles.confidenceCard}>
                  <View style={styles.confidenceHeader}>
                    <View>
                      <Text style={styles.confidenceTitle}>FINAL VERIFICATION SCORE</Text>
                      <View style={[styles.confidenceBadge, 
                        score.confidence_label === 'high' ? styles.badgeGreen : 
                        score.confidence_label === 'medium' ? styles.badgeAmber : styles.badgeRed
                      ]}>
                        <Shield size={12} color={
                          score.confidence_label === 'high' ? '#166534' : 
                          score.confidence_label === 'medium' ? '#b45309' : '#991b1b'
                        } />
                        <Text style={[styles.confidenceBadgeText,
                          { color: score.confidence_label === 'high' ? '#166534' : 
                                   score.confidence_label === 'medium' ? '#b45309' : '#991b1b' }
                        ]}>
                          {score.confidence_label === 'high' ? 'High Confidence' :
                           score.confidence_label === 'medium' ? 'Medium Confidence' : 'Limited Evidence'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.overallScoreText}>{score.overall_score ?? 0}</Text>
                      <Text style={styles.scoreDenominator}>/100</Text>
                    </View>
                  </View>

                  {/* AI Fraud Detection Banner */}
                  {score.fraud_probability !== undefined && (
                    <View style={styles.fraudBanner}>
                      <View style={styles.fraudRow}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.fraudLabel}>AI FRAUD DETECTION</Text>
                      </View>
                      <Text style={[styles.fraudRiskText, 
                        score.fraud_probability > 0.65 ? styles.textRedLight : 
                        score.fraud_probability < 0.35 ? styles.textGreenLight : styles.textAmberLight
                      ]}>
                        {Math.round(score.fraud_probability * 100)}% Risk
                      </Text>
                    </View>
                  )}

                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { 
                      width: `${score.overall_score ?? 0}%`,
                      backgroundColor: (score.overall_score ?? 0) >= 70 ? '#10b981' : (score.overall_score ?? 0) >= 40 ? '#f59e0b' : '#ef4444'
                    }]} />
                  </View>

                  {/* Breakdown Bars */}
                  <View style={styles.breakdownContainer}>
                    {[
                      { label: 'Coding (20%)', value: score.coding_test_score ?? score.practice_score ?? 0, color: '#d97706' },
                      { label: 'LeetCode (25%)', value: score.leetcode_score ?? 0, color: '#7c3aed' },
                      { label: 'GitHub (20%)', value: score.github_score ?? 0, color: '#2563eb' },
                      { label: 'Skills (20%)', value: score.skill_match_score ?? score.profile_completeness_score ?? 0, color: '#059669' },
                      { label: 'Projects (15%)', value: score.project_cert_score ?? 0, color: '#e11d48' },
                    ].map(bar => (
                      <View key={bar.label} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{bar.label}</Text>
                        <View style={styles.breakdownProgressBg}>
                          <View style={[styles.breakdownProgressFill, { width: `${bar.value}%`, backgroundColor: bar.color }]} />
                        </View>
                        <Text style={styles.breakdownValue}>{bar.value}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Skill Gaps */}
                  {score.skill_gaps && score.skill_gaps.length > 0 && (
                    <View style={styles.gapsSection}>
                      <Text style={styles.gapsTitle}>SKILL GAPS</Text>
                      <View style={styles.gapsRow}>
                        {score.skill_gaps.map((gap: string) => (
                          <View key={gap} style={styles.gapBadge}>
                            <Text style={styles.gapText}>{gap}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.actionRow}>
                 <TouchableOpacity style={styles.btnSecondary} onPress={handleUploadResume}>
                    <Upload size={16} color="#0f172a" />
                    <Text style={styles.btnTextSecondary}>Upload Resume (PDF)</Text>
                 </TouchableOpacity>
                 {profile?.resume_url && (
                   <TouchableOpacity style={styles.btnSecondary} onPress={handleParse} disabled={parsing}>
                      {parsing ? <ActivityIndicator size="small" color="#0f172a" /> : <FileText size={16} color="#0f172a" />}
                      <Text style={styles.btnTextSecondary}>{parsing ? 'Extracting...' : 'Parse Resume'}</Text>
                   </TouchableOpacity>
                 )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Headline</Text>
                <TextInput style={styles.input} value={headline} onChangeText={setHeadline} placeholder="e.g. Full Stack Developer" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Phone Number" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Location" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Years of Experience</Text>
                <TextInput style={styles.input} value={yearsExperience} onChangeText={setYearsExperience} keyboardType="numeric" placeholder="Years of Experience" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>GitHub URL</Text>
                <TextInput style={styles.input} value={githubUrl} onChangeText={setGithubUrl} placeholder="GitHub URL" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>LeetCode URL</Text>
                <TextInput style={styles.input} value={leetcodeUrl} onChangeText={setLeetcodeUrl} placeholder="LeetCode URL" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput style={[styles.input, { height: 80 }]} multiline value={bio} onChangeText={setBio} placeholder="Bio description" />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
              </TouchableOpacity>

              <Text style={styles.miniHeader}>ACTIVITY JOURNEY</Text>
              {timeline.length === 0 ? (
                <Text style={styles.emptyText}>No activity logged yet.</Text>
              ) : (
                timeline.map((event, idx) => (
                  <View key={idx} style={styles.timelineItem}>
                     <View style={styles.timelineDot} />
                     <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{event.event_title}</Text>
                        <Text style={styles.timelineDesc}>{event.event_detail}</Text>
                        <Text style={styles.timelineDate}>{new Date(event.created_at).toLocaleDateString()}</Text>
                     </View>
                  </View>
                ))
              )}
            </View>
          )}

          {tab === 'feedback' && (
            <View style={styles.feedbackContainer}>
              <View style={styles.row}>
                 <MessageSquare size={18} color="#0f172a" />
                 <Text style={styles.sectionTitle}>AI Resume Feedback</Text>
              </View>
              {loadingFeedback ? <ActivityIndicator color="#0f172a" /> : (
                feedback ? (
                  <View style={styles.feedbackCard}>
                     <View style={styles.scoreRow}>
                        <Text style={styles.feedbackScoreVal}>{feedback.score}/100</Text>
                        <Text style={styles.feedbackScoreLab}>AI ANALYSIS SCORE</Text>
                     </View>
                     <Text style={styles.feedbackContent}>{feedback.feedback}</Text>
                     <View style={styles.tipsBox}>
                        <AlertCircle size={14} color="#3b82f6" />
                        <Text style={styles.tipsText}>Tip: Upload a new resume to get updated AI insights.</Text>
                     </View>
                  </View>
                ) : <Text style={styles.emptyText}>Upload your resume to get AI-powered feedback.</Text>
              )}
            </View>
          )}

          {tab === 'skills' && (
            <View style={styles.skillsList}>
              {data?.skills?.map((s: any) => (
                <TouchableOpacity key={s.id} onPress={() => showEvidence(s.name)} style={styles.skillBadge}>
                  <Text style={styles.skillName}>{s.name}</Text>
                  {s.verification_level !== 'claimed' && <ShieldCheck size={14} color="#059669" />}
                  <TouchableOpacity onPress={() => handleDeleteSkill(s.id)}>
                    <Trash2 size={14} color="#ef4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}

              <View style={styles.addSkillForm}>
                <TextInput style={styles.skillInput} value={newSkillName} onChangeText={setNewSkillName} placeholder="Add skill..." />
                
                <View style={styles.levelSelector}>
                  {(['beginner', 'intermediate', 'expert'] as const).map(lvl => (
                    <TouchableOpacity key={lvl} onPress={() => setNewSkillLevel(lvl)} style={[styles.levelBtn, newSkillLevel === lvl && styles.levelBtnActive]}>
                      <Text style={[styles.levelBtnText, newSkillLevel === lvl && styles.levelBtnTextActive]}>{lvl.charAt(0).toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.addBtn} onPress={handleAddSkill}>
                  <Plus size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {tab === 'projects' && (
            <View style={styles.projectsList}>
               {data?.projects?.map((p: any) => (
                 <View key={p.id} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                       <Text style={styles.itemTitle}>{p.title}</Text>
                       <TouchableOpacity onPress={() => apiClient.delete(`/projects/${p.id}`).then(loadData)}>
                          <Trash2 size={16} color="#ef4444" />
                       </TouchableOpacity>
                    </View>
                    <Text style={styles.itemDesc}>{p.description}</Text>
                    <View style={styles.chipRow}>
                       {p.technologies?.map((t: string) => (
                         <View key={t} style={styles.miniChip}><Text style={styles.miniChipText}>{t}</Text></View>
                       ))}
                    </View>
                 </View>
               ))}
               <TouchableOpacity style={styles.addBtnLarge} onPress={() => setProjectModalVisible(true)}>
                  <Plus size={20} color="#0f172a" />
                  <Text style={styles.addBtnTextLarge}>Add New Project</Text>
               </TouchableOpacity>
            </View>
          )}

          {tab === 'experience' && (
            <View style={styles.experienceList}>
               {data?.experience?.map((e: any) => (
                 <View key={e.id} style={styles.listItem}>
                    <Briefcase size={20} color="#94a3b8" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                       <Text style={styles.itemTitle}>{e.role}</Text>
                       <Text style={styles.itemSubtitle}>{e.company} • {e.location}</Text>
                       {e.description && <Text style={styles.expDescText}>{e.description}</Text>}
                    </View>
                    <TouchableOpacity onPress={() => apiClient.delete(`/experience/${e.id}`).then(loadData)}>
                       <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                 </View>
               ))}
               <TouchableOpacity style={styles.addBtnLarge} onPress={() => setExperienceModalVisible(true)}>
                  <Plus size={20} color="#0f172a" />
                  <Text style={styles.addBtnTextLarge}>Add Experience</Text>
               </TouchableOpacity>
            </View>
          )}

          {tab === 'education' && (
            <View style={styles.educationList}>
               {data?.education?.map((e: any) => (
                 <View key={e.id} style={styles.listItem}>
                    <BookOpen size={20} color="#94a3b8" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                       <Text style={styles.itemTitle}>{e.degree}</Text>
                       <Text style={styles.itemSubtitle}>{e.institution} ({e.start_year} - {e.end_year})</Text>
                    </View>
                    <TouchableOpacity onPress={() => apiClient.delete(`/education/${e.id}`).then(loadData)}>
                       <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                 </View>
               ))}
               <TouchableOpacity style={styles.addBtnLarge} onPress={() => setEducationModalVisible(true)}>
                  <Plus size={20} color="#0f172a" />
                  <Text style={styles.addBtnTextLarge}>Add Education</Text>
               </TouchableOpacity>
            </View>
          )}

          {tab === 'certificates' && (
            <View style={styles.certList}>
               {data?.certificates?.map((c: any) => (
                 <View key={c.id} style={styles.listItem}>
                    <Award size={20} color="#059669" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                       <Text style={styles.itemTitle}>{c.name}</Text>
                       <Text style={styles.itemSubtitle}>{c.issuer}</Text>
                    </View>
                    <TouchableOpacity onPress={() => apiClient.delete(`/certificates/${c.id}`).then(loadData)}>
                       <Trash2 size={16} color="#ef4444" />
                    </TouchableOpacity>
                 </View>
               ))}
               <TouchableOpacity style={styles.addBtnLarge} onPress={() => setCertificateModalVisible(true)}>
                  <Plus size={20} color="#0f172a" />
                  <Text style={styles.addBtnTextLarge}>Add Certificate</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Hiring Verdict (HV) Modal */}
      <Modal animationType="slide" transparent={true} visible={hvModalVisible} onRequestClose={() => setHvModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hiring Verdicts</Text>
              <TouchableOpacity onPress={() => setHvModalVisible(false)}>
                <X size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {hiringStatus.length === 0 ? (
                <Text style={styles.emptyText}>No verdict logs found.</Text>
              ) : (
                hiringStatus.map((verdict: any, idx: number) => (
                  <View key={idx} style={[styles.verdictItem, { borderColor: verdict.status === 'shortlisted' ? '#ddd6fe' : '#f1f5f9' }]}>
                    <View style={styles.verdictMeta}>
                      <Text style={styles.verdictHr}>{verdict.hr_name || 'Anonymous Recruiter'}</Text>
                      <Text style={styles.verdictStatus}>{verdict.status.toUpperCase()}</Text>
                    </View>
                    {verdict.notes && <Text style={styles.verdictNotes}>"{verdict.notes.trim()}"</Text>}
                    <Text style={styles.verdictDate}>{new Date(verdict.created_at).toLocaleDateString()}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Skill Evidence Modal */}
      <Modal animationType="slide" transparent={true} visible={evidenceModalVisible} onRequestClose={() => setEvidenceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedSkill} — Verification Details</Text>
              <TouchableOpacity onPress={() => setEvidenceModalVisible(false)}>
                <X size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>
            {loadingEvidence ? (
              <ActivityIndicator size="large" color="#0f172a" style={{ marginVertical: 30 }} />
            ) : (
              <View>
                {evidenceData?.verification && (
                  <View style={styles.evidenceChecks}>
                    {[
                      { key: 'Resume', val: evidenceData.verification.has_resume },
                      { key: 'GitHub', val: evidenceData.verification.has_github },
                      { key: 'LeetCode', val: evidenceData.verification.has_leetcode },
                      { key: 'Practice', val: evidenceData.verification.has_practice },
                      { key: 'Projects', val: evidenceData.verification.has_project }
                    ].map(chk => (
                      <View key={chk.key} style={[styles.checkTag, chk.val ? styles.tagActive : styles.tagInactive]}>
                        <Text style={[styles.checkTagText, chk.val ? styles.tagActiveText : styles.tagInactiveText]}>
                          {chk.val ? '✓' : '✗'} {chk.key}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <ScrollView style={{ maxHeight: 250, marginTop: 15 }}>
                  {evidenceData?.evidence?.github?.repo_count > 0 && (
                    <View style={styles.evidenceDetailBlock}>
                      <Text style={styles.detailBlockHeader}>GitHub Code evidence</Text>
                      <Text style={styles.detailBlockText}>{evidenceData.evidence.github.repo_count} repositories contain code in this skill/language.</Text>
                    </View>
                  )}

                  {evidenceData?.evidence?.practice?.correct_answers > 0 && (
                    <View style={styles.evidenceDetailBlock}>
                      <Text style={styles.detailBlockHeader}>Practice solving correctness</Text>
                      <Text style={styles.detailBlockText}>{evidenceData.evidence.practice.correct_answers} correct question attempts match this skills module.</Text>
                    </View>
                  )}

                  {evidenceData?.evidence?.projects?.length > 0 && (
                    <View style={styles.evidenceDetailBlock}>
                      <Text style={styles.detailBlockHeader}>Linked portfolio projects</Text>
                      {evidenceData.evidence.projects.map((p: any) => (
                        <Text key={p.title} style={styles.detailBlockListText}>• {p.title}</Text>
                      ))}
                    </View>
                  )}

                  {(!evidenceData?.evidence?.github?.repo_count && !evidenceData?.evidence?.practice?.correct_answers && !evidenceData?.evidence?.projects?.length) && (
                    <Text style={styles.emptyText}>No cross-validated sources match this skill yet. Add related projects or complete practice code tests.</Text>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Project Add Modal */}
      <Modal animationType="fade" transparent={true} visible={projectModalVisible} onRequestClose={() => setProjectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Project</Text>
              <TouchableOpacity onPress={() => setProjectModalVisible(false)}><X size={20} color="#0f172a" /></TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <TextInput style={styles.input} value={pTitle} onChangeText={setPTitle} placeholder="Project Title" />
              <TextInput style={[styles.input, { height: 60 }]} multiline value={pDesc} onChangeText={setPDesc} placeholder="Description" />
              <TextInput style={styles.input} value={pGithub} onChangeText={setPGithub} placeholder="GitHub URL" />
              <TextInput style={styles.input} value={pDemo} onChangeText={setPDemo} placeholder="Demo/Project URL" />
              <TextInput style={styles.input} value={pTech} onChangeText={setPTech} placeholder="Technologies (e.g. React, Node)" />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddProject}>
                <Text style={styles.saveBtnText}>Save Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Experience Add Modal */}
      <Modal animationType="fade" transparent={true} visible={experienceModalVisible} onRequestClose={() => setExperienceModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Experience</Text>
              <TouchableOpacity onPress={() => setExperienceModalVisible(false)}><X size={20} color="#0f172a" /></TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <TextInput style={styles.input} value={expRole} onChangeText={setExpRole} placeholder="Role" />
              <TextInput style={styles.input} value={expCompany} onChangeText={setExpCompany} placeholder="Company" />
              <TextInput style={styles.input} value={expLoc} onChangeText={setExpLoc} placeholder="Location" />
              <TextInput style={styles.input} value={expStart} onChangeText={setExpStart} placeholder="Start Date" />
              <TextInput style={styles.input} value={expEnd} onChangeText={setExpEnd} placeholder="End Date (or Present)" />
              <TextInput style={[styles.input, { height: 60 }]} multiline value={expDesc} onChangeText={setExpDesc} placeholder="Description" />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddExperience}>
                <Text style={styles.saveBtnText}>Save Experience</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Education Add Modal */}
      <Modal animationType="fade" transparent={true} visible={educationModalVisible} onRequestClose={() => setEducationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Education</Text>
              <TouchableOpacity onPress={() => setEducationModalVisible(false)}><X size={20} color="#0f172a" /></TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <TextInput style={styles.input} value={eduInst} onChangeText={setEduInst} placeholder="Institution" />
              <TextInput style={styles.input} value={eduDegree} onChangeText={setEduDegree} placeholder="Degree" />
              <TextInput style={styles.input} value={eduField} onChangeText={setEduField} placeholder="Field of Study" />
              <TextInput style={styles.input} value={eduStart} onChangeText={setEduStart} keyboardType="numeric" placeholder="Start Year" />
              <TextInput style={styles.input} value={eduEnd} onChangeText={setEduEnd} keyboardType="numeric" placeholder="End Year" />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddEducation}>
                <Text style={styles.saveBtnText}>Save Education</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Certificate Add Modal */}
      <Modal animationType="fade" transparent={true} visible={certificateModalVisible} onRequestClose={() => setCertificateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Certificate</Text>
              <TouchableOpacity onPress={() => setCertificateModalVisible(false)}><X size={20} color="#0f172a" /></TouchableOpacity>
            </View>
            <View style={{ gap: 10 }}>
              <TextInput style={styles.input} value={certName} onChangeText={setCertName} placeholder="Certificate Name" />
              <TextInput style={styles.input} value={certIssuer} onChangeText={setCertIssuer} placeholder="Issuing Organization" />
              <TextInput style={styles.input} value={certDate} onChangeText={setCertDate} placeholder="Issue Date" />
              <TextInput style={styles.input} value={certUrl} onChangeText={setCertUrl} placeholder="Credential URL" />
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddCertificate}>
                <Text style={styles.saveBtnText}>Save Certificate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  headerCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  profileInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  email: { fontSize: 14, color: '#64748b', marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  availabilityBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeGreen: { backgroundColor: '#f0faf5', borderColor: '#a7f3d0' },
  badgeGray: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  textGreen: { fontSize: 11, fontWeight: 'bold', color: '#047857' },
  textGray: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  hvBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btnPrimary: { flex: 1, backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
  btnTextPrimary: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  btnSecondary: { flex: 1, backgroundColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12 },
  btnTextSecondary: { color: '#0f172a', fontWeight: 'bold', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  statCard: { flex: 1, minWidth: '45%', padding: 15, borderRadius: 16, alignItems: 'center' },
  statCount: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  tabBar: { flexDirection: 'row', marginTop: 30, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTabItem: { borderBottomColor: '#0f172a' },
  tabLabel: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  activeTabLabel: { color: '#0f172a' },
  content: { marginTop: 20 },
  overview: { gap: 15 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 14, fontWeight: 'bold', color: '#64748b' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b' },
  saveBtn: { backgroundColor: '#0f172a', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },
  skillsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skillBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  skillName: { fontSize: 14, color: '#1e293b', fontWeight: '500' },
  addSkillForm: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginTop: 20 },
  skillInput: { flex: 2, minWidth: 150, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  levelSelector: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  levelBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  levelBtnActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  levelBtnText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },
  levelBtnTextActive: { color: '#fff' },
  addBtn: { backgroundColor: '#0f172a', width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: 12, textAlign: 'center', marginVertical: 10 },
  itemCard: { backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#f1f5f9', width: '100%' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  itemDesc: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniChipText: { fontSize: 10, color: '#475569', fontWeight: 'bold' },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9', width: '100%' },
  itemSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  expDescText: { fontSize: 12, color: '#64748b', marginTop: 6, fontStyle: 'italic' },
  addBtnLarge: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 15, borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#cbd5e1', marginTop: 10 },
  addBtnTextLarge: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  feedbackContainer: { gap: 15 },
  feedbackCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 1 },
  feedbackScoreVal: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  feedbackScoreLab: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginTop: 4 },
  feedbackContent: { fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 15 },
  tipsBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', padding: 12, borderRadius: 12, marginTop: 20 },
  tipsText: { fontSize: 11, color: '#1e40af', flex: 1 },
  timelineItem: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0f172a', marginTop: 5 },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  timelineDesc: { fontSize: 11, color: '#64748b', marginTop: 2 },
  timelineDate: { fontSize: 9, color: '#94a3b8', marginTop: 4 },
  miniHeader: { fontSize: 12, fontWeight: 'bold', color: '#64748b', letterSpacing: 1, marginTop: 20, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  projectsList: { gap: 15 },
  experienceList: { gap: 15 },
  educationList: { gap: 15 },
  certList: { gap: 15 },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 450, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  verdictItem: { borderBottomWidth: 1, paddingBottom: 15, marginBottom: 15 },
  verdictMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  verdictHr: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  verdictStatus: { fontSize: 10, fontWeight: 'bold', color: '#a855f7' },
  verdictNotes: { fontSize: 13, color: '#475569', fontStyle: 'italic', marginVertical: 6 },
  verdictDate: { fontSize: 11, color: '#94a3b8' },
  
  evidenceChecks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 15 },
  checkTag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  tagActive: { backgroundColor: '#f0faf5', borderColor: '#a7f3d0' },
  tagInactive: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  checkTagText: { fontSize: 11, fontWeight: 'bold' },
  tagActiveText: { color: '#047857' },
  tagInactiveText: { color: '#94a3b8' },
  evidenceDetailBlock: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 12, marginBottom: 10 },
  detailBlockHeader: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  detailBlockText: { fontSize: 12, color: '#64748b', lineHeight: 16 },
  detailBlockListText: { fontSize: 12, color: '#64748b', marginTop: 2 },
  
  // Confidence Card Styles
  confidenceCard: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  confidenceTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 6, borderWidth: 1 },
  badgeAmber: { backgroundColor: '#fdf8f0', borderColor: '#fde68a' },
  badgeRed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  confidenceBadgeText: { fontSize: 11, fontWeight: 'bold' },
  scoreContainer: { alignItems: 'flex-end', flexDirection: 'row', gap: 2 },
  overallScoreText: { fontSize: 36, fontWeight: '900', color: '#1e293b', lineHeight: 38 },
  scoreDenominator: { fontSize: 12, color: '#94a3b8', paddingBottom: 4 },
  fraudBanner: { backgroundColor: '#0f172a', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  fraudRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  fraudLabel: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
  fraudRiskText: { fontSize: 20, fontWeight: '900' },
  textRedLight: { color: '#f87171' },
  textGreenLight: { color: '#4ade80' },
  textAmberLight: { color: '#fbbf24' },
  progressBarBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 20 },
  progressBarFill: { height: '100%', borderRadius: 4 },
  breakdownContainer: { gap: 12, marginBottom: 20 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  breakdownLabel: { fontSize: 12, fontWeight: '600', color: '#475569', width: 110 },
  breakdownProgressBg: { flex: 1, height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  breakdownProgressFill: { height: '100%', borderRadius: 3 },
  breakdownValue: { fontSize: 12, fontWeight: 'bold', color: '#1e293b', width: 24, textAlign: 'right' },
  gapsSection: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  gapsTitle: { fontSize: 11, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginBottom: 10 },
  gapsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  gapBadge: { backgroundColor: '#fff5f5', borderColor: '#fee2e2', borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  gapText: { fontSize: 11, color: '#ef4444', fontWeight: 'bold' }
});
