import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  Search,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Target,
  Sparkles,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function HRMatchScreen({ navigation }: any) {
  const [form, setForm] = useState({
    required_skills: '',
    technologies: '',
    min_experience: '',
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!form.required_skills.trim()) return;
    setLoading(true);
    try {
      const payload: any = {
        required_skills: form.required_skills.split(',').map((s) => s.trim()).filter(Boolean),
        technologies: form.technologies.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (form.min_experience) payload.min_experience = parseInt(form.min_experience);

      const res = await apiClient.post('/hr/match', payload);
      setResults(res.data?.matches || res.data?.data || []);
      setSearched(true);
    } catch (err) {
      console.log('Match error:', err);
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (pct: number) => {
    if (pct >= 80) return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
    if (pct >= 50) return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
    return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
  };

  return (
    <DashboardLayout title="Req. Match" scrollable={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Requirement Matching</Text>
          <Text style={styles.heroSubtitle}>
            Enter job requirements to calculate instant evidence-backed match rankings
          </Text>
        </View>

        {/* Input Requirements Form */}
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Job Requirements</Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>REQUIRED SKILLS *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. React, Node.js, PostgreSQL, Docker"
              placeholderTextColor="#94a3b8"
              value={form.required_skills}
              onChangeText={(t) => setForm((s) => ({ ...s, required_skills: t }))}
            />
            <Text style={styles.fieldHelper}>Comma separated skill keywords</Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>TECHNOLOGIES / TOOLS</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. AWS, Kubernetes, Redis, Tailwind"
              placeholderTextColor="#94a3b8"
              value={form.technologies}
              onChangeText={(t) => setForm((s) => ({ ...s, technologies: t }))}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>MIN. EXPERIENCE (YEARS)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={form.min_experience}
              onChangeText={(t) => setForm((s) => ({ ...s, min_experience: t }))}
            />
          </View>

          <TouchableOpacity
            style={[styles.searchBtn, (!form.required_skills.trim() || loading) && styles.searchBtnDisabled]}
            onPress={handleSearch}
            disabled={!form.required_skills.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Search size={16} color="#ffffff" />
                <Text style={styles.searchBtnText}>Find Matches</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {Boolean(searched) && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Ranking Results</Text>
              <Text style={styles.resultsCount}>{results.length} candidates ranked</Text>
            </View>

            {results.length === 0 ? (
              <View style={styles.emptyCard}>
                <Target size={40} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No matching candidates found</Text>
                <Text style={styles.emptyDesc}>Try broadening the required skill set or reducing experience.</Text>
              </View>
            ) : (
              <View style={styles.resultsList}>
                {results.map((c, i) => {
                  const matchStyle = getMatchColor(c.overall_match || 0);

                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.resultCard}
                      activeOpacity={0.7}
                      onPress={() => navigation.navigate('CandidateDetail', { id: c.id })}
                    >
                      {/* Rank Badge */}
                      <View style={[styles.rankBadge, { backgroundColor: matchStyle.bg }]}>
                        <Text style={[styles.rankText, { color: matchStyle.text }]}>#{i + 1}</Text>
                      </View>

                      {/* Candidate Information */}
                      <View style={styles.candidateDetails}>
                        <Text style={styles.candidateName} numberOfLines={1}>
                          {c.full_name || 'Candidate'}
                        </Text>

                        {/* Matched / Missing Skills Chips */}
                        <View style={styles.skillMatchesRow}>
                          {c.matched_skills?.slice(0, 3).map((s: string) => (
                            <View key={s} style={styles.matchedChip}>
                              <CheckCircle2 size={10} color="#059669" />
                              <Text style={styles.matchedChipText}>{s}</Text>
                            </View>
                          ))}
                          {c.missing_skills?.slice(0, 2).map((s: string) => (
                            <View key={s} style={styles.missingChip}>
                              <XCircle size={10} color="#dc2626" />
                              <Text style={styles.missingChipText}>{s}</Text>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Match Breakdown Columns */}
                      <View style={styles.scoreCols}>
                        <View style={styles.scoreBlock}>
                          <Text style={[styles.overallMatchVal, { color: matchStyle.text }]}>
                            {c.overall_match}%
                          </Text>
                          <Text style={styles.scoreLabel}>Match</Text>
                        </View>

                        <View style={styles.scoreBlock}>
                          <Text style={styles.subScoreVal}>{c.skill_match ?? 0}%</Text>
                          <Text style={styles.scoreLabel}>Skills</Text>
                        </View>

                        <ChevronRight size={16} color="#cbd5e1" style={{ marginLeft: 4 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  heroSection: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 3,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  fieldWrap: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
  },
  fieldHelper: {
    fontSize: 10,
    color: '#94a3b8',
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    height: 44,
    borderRadius: 10,
    marginTop: 6,
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  searchBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  resultsSection: {
    marginTop: 4,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultsCount: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  resultsList: {
    gap: 10,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '800',
  },
  candidateDetails: {
    flex: 1,
    marginRight: 8,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  skillMatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  matchedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  matchedChipText: {
    fontSize: 9,
    color: '#059669',
    fontWeight: '600',
  },
  missingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  missingChipText: {
    fontSize: 9,
    color: '#dc2626',
    fontWeight: '600',
  },
  scoreCols: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  overallMatchVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  subScoreVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

