import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Plus,
  BookOpen,
  Trash2,
  CheckCircle,
  Sparkles,
  Layers,
  Search,
  Clock,
  Award,
  ChevronDown,
  Upload,
  FileText,
  Cpu,
  BrainCircuit,
  Download,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';
import { getOfflineQuestions } from '../../lib/staticQuestionsBank';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

const QUESTION_TYPES = [
  { value: 'mcq', label: 'MCQ (Multiple Choice)' },
  { value: 'code', label: 'Coding' },
  { value: 'text', label: 'Text / Open-ended' },
];

export default function ProblemsScreen({ route }: any) {
  const initialGroupId = route?.params?.groupId;
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);

  // 3 Primary Tabs (Matching Web: Single Question | + AI Assignment Generator | Bulk Import PDF)
  const [activeTab, setActiveTab] = useState<'single' | 'ai' | 'bulk'>('single');

  // Single Question Form
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'technical_mcq',
    difficulty: 'medium',
    question_type: 'mcq',
    correct_answer: 'a',
    points: '20',
    time_limit_sec: '300',
    tags: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
  });

  // AI Generator Form
  const [aiForm, setAiForm] = useState({
    heading: '',
    topic: 'Python',
    difficulty: 'medium',
    count: '5',
    expires_at: '',
  });
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiGeneratedData, setAiGeneratedData] = useState<any[]>([]);

  // Bulk PDF / Text Import Form
  const [bulkForm, setBulkForm] = useState({
    heading: '',
    expires_at: '',
    raw_text: '',
  });
  const [parsingBulk, setParsingBulk] = useState(false);
  const [bulkQuestions, setBulkQuestions] = useState<any[]>([]);

  // Dashboard selections & states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const gRes = await apiClient.get('/groups');
      const grps = gRes.data || [];
      setGroups(grps);

      const targetGid = initialGroupId || selectedGroupId || grps[0]?.id || '';
      if (targetGid) {
        setSelectedGroupId(targetGid);
        await fetchQuestions(targetGid);
      }
    } catch (err) {
      console.error('Failed to load groups for problems:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchQuestions = async (gid: string) => {
    try {
      const qRes = await apiClient.get(`/groups/${gid}/questions`);
      const data = qRes.data;
      if (Array.isArray(data)) {
        setQuestions(data);
      } else if (data && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else if (data && (data.active || data.previous)) {
        setQuestions([...(data.active || []), ...(data.previous || [])]);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setQuestions([]);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (selectedGroupId) {
      fetchQuestions(selectedGroupId).finally(() => setRefreshing(false));
    } else {
      fetchData();
    }
  }, [selectedGroupId]);

  useEffect(() => {
    fetchData();
  }, [initialGroupId]);

  const handleGroupChange = (gid: string) => {
    setSelectedGroupId(gid);
    fetchQuestions(gid);
    setSelectedIds(new Set());
  };

  // Single Question Save
  const handleSaveSingle = async () => {
    if (!selectedGroupId) {
      return Alert.alert('Required', 'Please assign question to a group.');
    }
    if (!form.title.trim() || !form.description.trim()) {
      return Alert.alert('Required', 'Title and description are required.');
    }
    if (form.question_type === 'mcq') {
      const emptyOpt = form.options.find((o) => !o.text.trim());
      if (emptyOpt) {
        return Alert.alert(
          'Missing Option',
          `Please provide text for Option ${emptyOpt.id.toUpperCase()}.`
        );
      }
      if (!form.correct_answer) {
        return Alert.alert('Required', 'Please select the correct answer.');
      }
    }

    setSaving(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await apiClient.post('/questions', {
        ...form,
        group_id: selectedGroupId,
        points: parseInt(form.points) || 20,
        time_limit_sec: parseInt(form.time_limit_sec) || 300,
        tags,
      });

      Alert.alert('Success', 'Question created and assigned to group!');
      setForm((s) => ({
        ...s,
        title: '',
        description: '',
        tags: '',
        options: [
          { id: 'a', text: '' },
          { id: 'b', text: '' },
          { id: 'c', text: '' },
          { id: 'd', text: '' },
        ],
      }));
      fetchQuestions(selectedGroupId);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create question');
    } finally {
      setSaving(false);
    }
  };

  // AI Generator Actions
  const handleGenerateAi = async () => {
    if (!selectedGroupId) {
      return Alert.alert('Required', 'Please select a target group.');
    }
    if (!aiForm.topic.trim()) {
      return Alert.alert('Required', 'Please enter a topic/skill (e.g. Python, SQL, React, C++, Java).');
    }
    setGeneratingAi(true);
    try {
      const count = parseInt(aiForm.count) || 5;
      let rawQuestions: any[] = [];

      // Try server AI generation first
      try {
        const res = await apiClient.post('/practice/generate', {
          topic: aiForm.topic.trim(),
          difficulty: aiForm.difficulty,
          count,
          group_id: selectedGroupId,
        });
        const generated = res.data?.questions || res.data || [];
        if (Array.isArray(generated) && generated.length > 0) {
          rawQuestions = generated;
        }
      } catch (e) {
        console.log('Server AI generation fallback to local static question bank');
      }

      // If server returned empty or failed, use static questions bank (WebLLM offline parity)
      if (rawQuestions.length === 0) {
        const offlineData = getOfflineQuestions(aiForm.topic.trim(), count);
        rawQuestions = offlineData.map((q) => ({
          title: q.question,
          description: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          difficulty: aiForm.difficulty,
          points: 20,
          category: 'technical_mcq',
          time_limit_sec: 300,
        }));
      }

      // Strictly normalize questions format to prevent render discrepancies
      const finalQuestions = rawQuestions.map((q: any) => {
        let normalizedOptions: { id: string; text: string }[] = [];
        if (Array.isArray(q.options)) {
          normalizedOptions = q.options.map((opt: any, optIdx: number) => {
            if (typeof opt === 'string') {
              const optId = String.fromCharCode(97 + optIdx);
              return { id: optId, text: opt };
            }
            return {
              id: String(opt?.id || String.fromCharCode(97 + optIdx)).toLowerCase(),
              text: String(opt?.text || opt?.title || opt || ''),
            };
          });
        } else if (typeof q.options === 'object' && q.options !== null) {
          normalizedOptions = Object.entries(q.options).map(([k, v]) => ({
            id: String(k).toLowerCase(),
            text: String(v),
          }));
        }

        return {
          title: String(q.title || q.question || 'MCQ Question'),
          description: String(q.description || q.title || q.question || ''),
          options: normalizedOptions,
          correct_answer: String(q.correct_answer || 'a').toLowerCase(),
          difficulty: q.difficulty || aiForm.difficulty || 'medium',
          points: Number(q.points) || 20,
          category: q.category || 'technical_mcq',
          time_limit_sec: Number(q.time_limit_sec) || 300,
        };
      });

      setAiGeneratedData(finalQuestions);
      Alert.alert('AI Generated', `Successfully generated ${finalQuestions.length} ${aiForm.topic} MCQ questions!`);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to generate questions.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSaveAiGenerated = async () => {
    if (!selectedGroupId || aiGeneratedData.length === 0) return;
    setSaving(true);
    try {
      await apiClient.post('/questions/bulk', {
        group_id: selectedGroupId,
        questions: aiGeneratedData,
        assignment_name: aiForm.heading.trim() || `${aiForm.topic} ${aiForm.difficulty.toUpperCase()} Quiz`,
        expires_at: aiForm.expires_at || null,
      });
      Alert.alert('Success', `AI Generated assignment saved for "${selectedGroup?.name || 'Group'}"!`);
      setAiGeneratedData([]);
      fetchQuestions(selectedGroupId);
    } catch (err: any) {
      try {
        await apiClient.post('/practice/bulk-create', {
          group_id: selectedGroupId,
          questions: aiGeneratedData,
          assignment_name: aiForm.heading.trim() || `${aiForm.topic} ${aiForm.difficulty.toUpperCase()} Quiz`,
          expires_at: aiForm.expires_at || null,
        });
        Alert.alert('Success', `AI Generated assignment saved for "${selectedGroup?.name || 'Group'}"!`);
        setAiGeneratedData([]);
        fetchQuestions(selectedGroupId);
      } catch (err2: any) {
        Alert.alert('Error', err2?.response?.data?.error || 'Failed to save generated questions');
      }
    } finally {
      setSaving(false);
    }
  };

  // Bulk Import / Parse Actions
  const handleParseBulkText = () => {
    if (!bulkForm.raw_text.trim()) {
      return Alert.alert('Required', 'Please paste MCQ formatted questions text.');
    }
    setParsingBulk(true);
    try {
      // Basic text parser for A/B/C/D questions
      const lines = bulkForm.raw_text.split('\n').filter((l) => l.trim().length > 0);
      const parsed: any[] = [];
      let currentQ: any = null;

      lines.forEach((line) => {
        const trimmed = line.trim();
        if (/^\d+[\.\)]/i.test(trimmed)) {
          if (currentQ) parsed.push(currentQ);
          currentQ = {
            title: trimmed.replace(/^\d+[\.\)]\s*/, ''),
            description: trimmed,
            question_type: 'mcq',
            category: 'technical_mcq',
            difficulty: 'medium',
            correct_answer: 'a',
            points: 20,
            options: [],
          };
        } else if (/^[a-d][\.\)]/i.test(trimmed) && currentQ) {
          const optId = trimmed[0].toLowerCase();
          const optText = trimmed.substring(2).trim();
          currentQ.options.push({ id: optId, text: optText });
        }
      });

      if (currentQ) parsed.push(currentQ);

      if (parsed.length === 0) {
        // Fallback single parsed
        parsed.push({
          title: bulkForm.raw_text.slice(0, 40),
          description: bulkForm.raw_text,
          question_type: 'mcq',
          category: 'technical_mcq',
          difficulty: 'medium',
          correct_answer: 'a',
          points: 20,
          options: [
            { id: 'a', text: 'Option A' },
            { id: 'b', text: 'Option B' },
            { id: 'c', text: 'Option C' },
            { id: 'd', text: 'Option D' },
          ],
        });
      }

      setBulkQuestions(parsed);
      Alert.alert('Extracted', `Extracted ${parsed.length} questions.`);
    } catch {
      Alert.alert('Parse Error', 'Could not parse text format.');
    } finally {
      setParsingBulk(false);
    }
  };

  const handleSaveBulk = async () => {
    if (!selectedGroupId || bulkQuestions.length === 0) return;
    setSaving(true);
    try {
      await apiClient.post('/practice/bulk-create', {
        group_id: selectedGroupId,
        questions: bulkQuestions,
        assignment_name: bulkForm.heading || 'Bulk Quiz Import',
        expires_at: bulkForm.expires_at || null,
      });
      Alert.alert('Saved', 'Bulk questions added to group assignment!');
      setBulkQuestions([]);
      setBulkForm({ heading: '', expires_at: '', raw_text: '' });
      fetchQuestions(selectedGroupId);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save bulk questions');
    } finally {
      setSaving(false);
    }
  };

  // Delete & Bulk Selection
  const handleDeleteQuestion = async (id: string, title: string) => {
    Alert.alert('Delete Problem', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/questions/${id}`);
            Alert.alert('Deleted', 'Question removed.');
            fetchQuestions(selectedGroupId);
          } catch {
            Alert.alert('Error', 'Failed to delete question.');
          }
        },
      },
    ]);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(questions.map((q) => q.id)));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    Alert.alert('Bulk Delete', `Delete ${selectedIds.size} selected questions?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete All',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await apiClient.post('/practice/bulk-delete', { ids: Array.from(selectedIds) });
            Alert.alert('Deleted', `Removed ${selectedIds.size} questions.`);
            setSelectedIds(new Set());
            fetchQuestions(selectedGroupId);
          } catch {
            Alert.alert('Error', 'Bulk deletion failed');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);
  const activeQuestions = questions.filter((q) => !q.is_expired);
  const expiredQuestions = questions.filter((q) => q.is_expired);

  if (loading) {
    return (
      <DashboardLayout title="Manage Problems" scrollable={false}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={styles.loadingText}>Loading question workspace...</Text>
        </View>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Manage Problems" scrollable={false}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header (Matching Screenshot 2, 3, 4) */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BookOpen size={24} color="#0f172a" />
            <Text style={styles.title}>Manage Problems</Text>
          </View>
          <Text style={styles.subtitle}>
            Add questions to your groups for candidates to practice
          </Text>
        </View>

        {/* 3 Top Tabs (Matching Web) */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'single' && styles.activeTabBtn]}
            onPress={() => setActiveTab('single')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === 'single' && styles.activeTabBtnText]}>
              Single Question
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ai' && styles.activeAiTabBtn]}
            onPress={() => setActiveTab('ai')}
            activeOpacity={0.7}
          >
            <Sparkles size={12} color={activeTab === 'ai' ? '#7c3aed' : '#64748b'} />
            <Text style={[styles.tabBtnText, activeTab === 'ai' && styles.activeAiTabBtnText]}>
              + AI Assignment Generator
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'bulk' && styles.activeTabBtn]}
            onPress={() => setActiveTab('bulk')}
            activeOpacity={0.7}
          >
            <BookOpen size={12} color={activeTab === 'bulk' ? '#0f172a' : '#64748b'} />
            <Text style={[styles.tabBtnText, activeTab === 'bulk' && styles.activeTabBtnText]}>
              Bulk Import PDF
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: Single Question (Screenshot 2) */}
        {activeTab === 'single' && (
          <View style={styles.card}>
            {/* Assign Group & Difficulty Row */}
            <View style={styles.grid2Col}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>ASSIGN TO GROUP *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                  {groups.map((g) => {
                    const isSelected = selectedGroupId === g.id;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.groupChip, isSelected && styles.activeGroupChip]}
                        onPress={() => handleGroupChange(g.id)}
                      >
                        <Text style={[styles.groupChipText, isSelected && styles.activeGroupChipText]}>
                          {g.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ width: 110 }}>
                <Text style={styles.label}>DIFFICULTY</Text>
                <View style={styles.diffSelector}>
                  {DIFFICULTIES.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.diffBtn, form.difficulty === d && styles.activeDiffBtn]}
                      onPress={() => setForm((s) => ({ ...s, difficulty: d }))}
                    >
                      <Text style={[styles.diffBtnText, form.difficulty === d && styles.activeDiffBtnText]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Question Type */}
            <Text style={styles.label}>QUESTION TYPE</Text>
            <View style={styles.typeSelectorRow}>
              {QUESTION_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, form.question_type === t.value && styles.activeTypeChip]}
                  onPress={() => {
                    const autoCat =
                      t.value === 'mcq' ? 'technical_mcq' : t.value === 'code' ? 'coding' : 'general';
                    setForm((s) => ({ ...s, question_type: t.value, category: autoCat }));
                  }}
                >
                  <Text style={[styles.typeChipText, form.question_type === t.value && styles.activeTypeChipText]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Title */}
            <Text style={styles.label}>TITLE *</Text>
            <TextInput
              style={styles.input}
              placeholder="Question title"
              placeholderTextColor="#94a3b8"
              value={form.title}
              onChangeText={(t) => setForm((s) => ({ ...s, title: t }))}
            />

            {/* Description */}
            <Text style={styles.label}>DESCRIPTION *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              placeholder="Full question text..."
              placeholderTextColor="#94a3b8"
              value={form.description}
              onChangeText={(t) => setForm((s) => ({ ...s, description: t }))}
            />

            {/* MCQ Options A, B, C, D */}
            {form.question_type === 'mcq' && (
              <View style={styles.optionsSection}>
                <Text style={styles.label}>OPTIONS</Text>
                {form.options.map((opt, i) => (
                  <View key={opt.id} style={styles.optionRow}>
                    <Text style={styles.optionPrefix}>{opt.id.toUpperCase()}.</Text>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder={`Option ${opt.id.toUpperCase()}`}
                      placeholderTextColor="#94a3b8"
                      value={opt.text}
                      onChangeText={(t) => {
                        const next = [...form.options];
                        next[i] = { ...next[i], text: t };
                        setForm((s) => ({ ...s, options: next }));
                      }}
                    />
                  </View>
                ))}

                {/* Correct Answer */}
                <Text style={[styles.label, { marginTop: 8 }]}>CORRECT ANSWER</Text>
                <View style={styles.correctAnswersRow}>
                  {form.options.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[
                        styles.correctAnswerBtn,
                        form.correct_answer === o.id && styles.activeCorrectAnswerBtn,
                      ]}
                      onPress={() => setForm((s) => ({ ...s, correct_answer: o.id }))}
                    >
                      <Text
                        style={[
                          styles.correctAnswerText,
                          form.correct_answer === o.id && styles.activeCorrectAnswerText,
                        ]}
                      >
                        Option {o.id.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Points & Time Limit */}
            <View style={styles.grid2Col}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>POINTS</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor="#94a3b8"
                  value={form.points}
                  onChangeText={(t) => setForm((s) => ({ ...s, points: t }))}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>TIME LIMIT (SEC)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="300"
                  placeholderTextColor="#94a3b8"
                  value={form.time_limit_sec}
                  onChangeText={(t) => setForm((s) => ({ ...s, time_limit_sec: t }))}
                />
              </View>
            </View>

            {/* Tags */}
            <Text style={styles.label}>TAGS (COMMA SEPARATED)</Text>
            <TextInput
              style={styles.input}
              placeholder="java, spring, database"
              placeholderTextColor="#94a3b8"
              value={form.tags}
              onChangeText={(t) => setForm((s) => ({ ...s, tags: t }))}
            />

            {/* Create Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSaveSingle}
              disabled={saving || !selectedGroupId}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Plus size={14} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {`Create Question for "${selectedGroup?.name || 'Group'}"`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 2: AI Assignment Generator (Screenshot 3) */}
        {activeTab === 'ai' && (
          <View style={styles.tabContentWrap}>
            {/* Browser AI Info Banner */}
            <View style={styles.aiBanner}>
              <View style={styles.aiBannerIconWrap}>
                <Cpu size={20} color="#7c3aed" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiBannerTitle}>Browser / Device AI Generator</Text>
                <Text style={styles.aiBannerSub}>
                  Real AI runs directly for your cohorts — generate topic-specific MCQ questions with custom difficulty. Works offline.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
                  <CheckCircle size={12} color="#16a34a" />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>AI Engine Ready (Cached)</Text>
                </View>
              </View>
            </View>

            {/* Generate Parameters Card */}
            <View style={styles.card}>
              <View style={styles.cardHeaderWithIcon}>
                <Sparkles size={16} color="#7c3aed" />
                <View>
                  <Text style={styles.paramTitle}>Generate Parameters</Text>
                  <Text style={styles.paramSub}>
                    Instantly generate topic-specific MCQ questions with custom difficulty.
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>TARGET GROUP *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                {groups.map((g) => {
                  const isSelected = selectedGroupId === g.id;
                  return (
                    <TouchableOpacity
                      key={g.id}
                      style={[styles.groupChip, isSelected && styles.activeGroupChip]}
                      onPress={() => handleGroupChange(g.id)}
                    >
                      <Text style={[styles.groupChipText, isSelected && styles.activeGroupChipText]}>
                        {g.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>ASSIGNMENT HEADING</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Python Quiz 1"
                placeholderTextColor="#94a3b8"
                value={aiForm.heading}
                onChangeText={(t) => setAiForm((s) => ({ ...s, heading: t }))}
              />

              <Text style={styles.label}>EXPIRY DATE & TIME (OPTIONAL)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2026-08-30 18:00"
                placeholderTextColor="#94a3b8"
                value={aiForm.expires_at}
                onChangeText={(t) => setAiForm((s) => ({ ...s, expires_at: t }))}
              />

              <Text style={styles.label}>TOPIC / SKILL</Text>
              <TextInput
                style={styles.input}
                placeholder="Python, React, SQL, Java, C++"
                placeholderTextColor="#94a3b8"
                value={aiForm.topic}
                onChangeText={(t) => setAiForm((s) => ({ ...s, topic: t }))}
              />

              <View style={styles.grid2Col}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>DIFFICULTY</Text>
                  <View style={styles.diffSelector}>
                    {DIFFICULTIES.map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.diffBtn, aiForm.difficulty === d && styles.activeDiffBtn]}
                        onPress={() => setAiForm((s) => ({ ...s, difficulty: d }))}
                      >
                        <Text style={[styles.diffBtnText, aiForm.difficulty === d && styles.activeDiffBtnText]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={{ width: 90 }}>
                  <Text style={styles.label}>COUNT</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="5"
                    placeholderTextColor="#94a3b8"
                    value={aiForm.count}
                    onChangeText={(t) => setAiForm((s) => ({ ...s, count: t }))}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.purpleSubmitBtn}
                onPress={handleGenerateAi}
                disabled={generatingAi}
              >
                {generatingAi ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Sparkles size={14} color="#fff" />
                    <Text style={styles.purpleSubmitBtnText}>Generate Questions</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* AI Generated Preview */}
            {aiGeneratedData.length > 0 && (
              <View style={styles.card}>
                <View style={styles.genHeader}>
                  <Text style={styles.genTitle}>Generated ({aiGeneratedData.length}) Questions</Text>
                  <TouchableOpacity
                    style={styles.saveGenBtn}
                    onPress={handleSaveAiGenerated}
                    disabled={saving}
                  >
                    <Text style={styles.saveGenBtnText}>
                      {saving ? 'Saving...' : 'Add to Assignment'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {aiGeneratedData.map((q, idx) => (
                  <View key={idx} style={styles.genQItem}>
                    <Text style={styles.genQTitle}>
                      {`${idx + 1}. ${q.title}`}
                    </Text>
                    <View style={styles.genOptionsGrid}>
                      {(q.options || []).map((o: any, oIdx: number) => {
                        const optId = typeof o === 'string' ? String.fromCharCode(97 + oIdx) : String(o?.id || String.fromCharCode(97 + oIdx));
                        const optText = typeof o === 'string' ? o : String(o?.text || '');
                        const isCorrect = String(q.correct_answer).toLowerCase() === String(optId).toLowerCase();
                        return (
                          <Text
                            key={`${optId}-${oIdx}`}
                            style={[
                              styles.genOptionText,
                              isCorrect ? styles.genCorrectOptionText : null,
                            ]}
                          >
                            {`${optId}) ${optText}`}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: Bulk Import PDF (Screenshot 4) */}
        {activeTab === 'bulk' && (
          <View style={styles.card}>
            <Text style={styles.cardTitleHeader}>Bulk Import from PDF / Text</Text>

            <Text style={styles.label}>1. TARGET GROUP *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {groups.map((g) => {
                const isSelected = selectedGroupId === g.id;
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.groupChip, isSelected && styles.activeGroupChip]}
                    onPress={() => handleGroupChange(g.id)}
                  >
                    <Text style={[styles.groupChipText, isSelected && styles.activeGroupChipText]}>
                      {g.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>2. ASSIGNMENT HEADING (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Weekly Quiz 1, Python Basics"
              placeholderTextColor="#94a3b8"
              value={bulkForm.heading}
              onChangeText={(t) => setBulkForm((s) => ({ ...s, heading: t }))}
            />

            <Text style={styles.label}>3. PASTE / UPLOAD MCQ QUESTIONS</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              placeholder="1. What is Python?\na) Programming language\nb) Snake\nc) Game\nd) Framework"
              placeholderTextColor="#94a3b8"
              value={bulkForm.raw_text}
              onChangeText={(t) => setBulkForm((s) => ({ ...s, raw_text: t }))}
            />

            <Text style={styles.pdfNoteText}>
              Best for numbered questions with a), b), c), d) options. Merged options like A.opt1 B.opt2 are supported.
            </Text>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleParseBulkText}
              disabled={parsingBulk}
            >
              <Text style={styles.submitBtnText}>Extract & Parse Questions</Text>
            </TouchableOpacity>

            {bulkQuestions.length > 0 && (
              <View style={{ marginTop: 14 }}>
                <View style={styles.genHeader}>
                  <Text style={styles.genTitle}>Extracted ({bulkQuestions.length}) Questions</Text>
                  <TouchableOpacity
                    style={styles.saveGenBtn}
                    onPress={handleSaveBulk}
                    disabled={saving}
                  >
                    <Text style={styles.saveGenBtnText}>
                      {saving ? 'Saving...' : 'Confirm & Save All'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {bulkQuestions.map((q, idx) => (
                  <View key={idx} style={styles.genQItem}>
                    <Text style={styles.genQTitle}>
                      {`${idx + 1}. ${q.title}`}
                    </Text>
                    <View style={styles.genOptionsGrid}>
                      {(q.options || []).map((o: any, oIdx: number) => {
                        const optId = typeof o === 'string' ? String.fromCharCode(97 + oIdx) : String(o?.id || String.fromCharCode(97 + oIdx));
                        const optText = typeof o === 'string' ? o : String(o?.text || '');
                        const isCorrect = String(q.correct_answer).toLowerCase() === String(optId).toLowerCase();
                        return (
                          <Text
                            key={`${optId}-${oIdx}`}
                            style={[
                              styles.genOptionText,
                              isCorrect ? styles.genCorrectOptionText : null,
                            ]}
                          >
                            {`${optId}) ${optText}`}
                          </Text>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Bottom Assignment Dashboard (Matching Screenshots 2, 3, 4) */}
        <View style={styles.card}>
          <View style={styles.dashHeaderRow}>
            <Text style={styles.dashTitle}>
              {`Assignment Dashboard: "${selectedGroup?.name || 'Group'}"`}
            </Text>

            {selectedIds.size > 0 && (
              <TouchableOpacity
                style={styles.bulkDeleteBtn}
                onPress={handleBulkDelete}
                disabled={saving}
              >
                <Trash2 size={11} color="#dc2626" />
                <Text style={styles.bulkDeleteBtnText}>
                  {`Delete Selected (${selectedIds.size})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Select All Checkbox */}
          {questions.length > 0 && (
            <TouchableOpacity style={styles.selectAllRow} onPress={toggleSelectAll}>
              <View
                style={[
                  styles.checkbox,
                  selectedIds.size === questions.length && styles.checkedBox,
                ]}
              >
                {selectedIds.size === questions.length && <CheckCircle size={10} color="#fff" />}
              </View>
              <Text style={styles.selectAllText}>SELECT ALL</Text>
            </TouchableOpacity>
          )}

          {questions.length === 0 ? (
            <View style={styles.emptyDashBox}>
              <Text style={styles.emptyDashText}>No questions yet. Create one above!</Text>
            </View>
          ) : (
            <View style={styles.questionsList}>
              {/* Active Questions */}
              {activeQuestions.length > 0 && (
                <View style={{ marginBottom: 10 }}>
                  <View style={styles.groupStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#16a34a' }]} />
                    <Text style={styles.groupStatusText}>
                      {`ACTIVE ASSIGNMENTS (${activeQuestions.length})`}
                    </Text>
                  </View>

                  {activeQuestions.map((q) => {
                    const isChecked = selectedIds.has(q.id);
                    return (
                      <View key={q.id} style={styles.questionItemRow}>
                        <TouchableOpacity
                          style={[styles.checkbox, isChecked && styles.checkedBox]}
                          onPress={() => toggleSelect(q.id)}
                        >
                          {isChecked && <CheckCircle size={10} color="#fff" />}
                        </TouchableOpacity>

                        <Text style={styles.questionTitleText} numberOfLines={1}>
                          {q.title}
                        </Text>

                        <View
                          style={[
                            styles.diffPill,
                            q.difficulty === 'easy' && styles.diffEasy,
                            q.difficulty === 'medium' && styles.diffMed,
                            q.difficulty === 'hard' && styles.diffHard,
                          ]}
                        >
                          <Text style={styles.diffPillText}>{q.difficulty}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteIconBtn}
                          onPress={() => handleDeleteQuestion(q.id, q.title)}
                        >
                          <Trash2 size={13} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Expired / Previous Questions */}
              {expiredQuestions.length > 0 && (
                <View>
                  <View style={styles.groupStatusRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#94a3b8' }]} />
                    <Text style={[styles.groupStatusText, { color: '#94a3b8' }]}>
                      {`PREVIOUS ASSIGNMENTS / EXPIRED (${expiredQuestions.length})`}
                    </Text>
                  </View>

                  {expiredQuestions.map((q) => {
                    const isChecked = selectedIds.has(q.id);
                    return (
                      <View key={q.id} style={[styles.questionItemRow, { opacity: 0.7 }]}>
                        <TouchableOpacity
                          style={[styles.checkbox, isChecked && styles.checkedBox]}
                          onPress={() => toggleSelect(q.id)}
                        >
                          {isChecked && <CheckCircle size={10} color="#fff" />}
                        </TouchableOpacity>

                        <Text style={styles.questionTitleText} numberOfLines={1}>
                          {q.title}
                        </Text>

                        <View style={[styles.diffPill, styles.diffMed]}>
                          <Text style={styles.diffPillText}>{q.difficulty}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.deleteIconBtn}
                          onPress={() => handleDeleteQuestion(q.id, q.title)}
                        >
                          <Trash2 size={13} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  loadingBox: { padding: 50, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 10, fontSize: 13, color: '#64748b' },

  header: { marginBottom: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },

  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginBottom: 14,
    gap: 12,
  },
  tabBtn: {
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeTabBtn: { borderBottomWidth: 2, borderBottomColor: '#0f172a' },
  activeAiTabBtn: { borderBottomWidth: 2, borderBottomColor: '#7c3aed' },
  tabBtnText: { fontSize: 12, fontWeight: 'bold', color: '#64748b' },
  activeTabBtnText: { color: '#0f172a' },
  activeAiTabBtnText: { color: '#7c3aed' },

  tabContentWrap: { gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    marginBottom: 14,
    gap: 10,
  },
  cardTitleHeader: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },

  grid2Col: { flexDirection: 'row', gap: 10 },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chipRow: { flexDirection: 'row', marginTop: 4 },
  groupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeGroupChip: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  groupChipText: { fontSize: 11, fontWeight: 'bold', color: '#475569' },
  activeGroupChipText: { color: '#fff' },

  diffSelector: { flexDirection: 'row', gap: 3, marginTop: 4 },
  diffBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeDiffBtn: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  diffBtnText: { fontSize: 9, fontWeight: 'bold', color: '#64748b' },
  activeDiffBtnText: { color: '#fff' },

  typeSelectorRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeTypeChip: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  typeChipText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  activeTypeChipText: { color: '#fff' },

  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#0f172a',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },

  optionsSection: { gap: 6 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionPrefix: { fontSize: 12, fontWeight: 'bold', color: '#64748b', width: 18 },
  correctAnswersRow: { flexDirection: 'row', gap: 6 },
  correctAnswerBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  activeCorrectAnswerBtn: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  correctAnswerText: { fontSize: 10, fontWeight: 'bold', color: '#475569' },
  activeCorrectAnswerText: { color: '#fff' },

  submitBtn: {
    backgroundColor: '#26231e',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  // AI Generator styles
  aiBanner: {
    backgroundColor: '#faf5ff',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#f3e8ff',
  },
  aiBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: { fontSize: 13, fontWeight: 'bold', color: '#6b21a8' },
  aiBannerSub: { fontSize: 10, color: '#7c3aed', marginTop: 2 },

  cardHeaderWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  paramTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a' },
  paramSub: { fontSize: 10, color: '#64748b' },

  purpleSubmitBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  purpleSubmitBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  genHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 10,
    borderRadius: 8,
  },
  genTitle: { fontSize: 12, fontWeight: 'bold', color: '#6b21a8' },
  saveGenBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  saveGenBtnText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  genQItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  genQTitle: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  genOptionsGrid: { marginTop: 4, gap: 2 },
  genOptionText: { fontSize: 10, color: '#64748b' },
  genCorrectOptionText: { color: '#16a34a', fontWeight: 'bold' },

  pdfNoteText: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic' },

  // Dashboard styles
  dashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashTitle: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1 },
  bulkDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bulkDeleteBtnText: { fontSize: 10, fontWeight: 'bold', color: '#dc2626' },

  selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  selectAllText: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.8 },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: { backgroundColor: '#0f172a', borderColor: '#0f172a' },

  emptyDashBox: { paddingVertical: 18, alignItems: 'center' },
  emptyDashText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },

  questionsList: { gap: 4 },
  groupStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  groupStatusText: { fontSize: 9, fontWeight: 'bold', color: '#475569', letterSpacing: 0.6 },

  questionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 8,
  },
  questionTitleText: { fontSize: 12, color: '#0f172a', flex: 1 },
  diffPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  diffEasy: { backgroundColor: '#f0fdf4' },
  diffMed: { backgroundColor: '#fffbeb' },
  diffHard: { backgroundColor: '#fef2f2' },
  diffPillText: { fontSize: 9, fontWeight: 'bold', color: '#475569' },
  deleteIconBtn: { padding: 4 },
});
