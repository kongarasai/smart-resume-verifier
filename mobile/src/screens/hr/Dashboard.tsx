import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Search,
  Filter,
  ChevronRight,
  Github,
  Code2,
  SlidersHorizontal,
  Briefcase,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Calendar,
  X,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

const READINESS_COLORS: Record<string, { bg: string; text: string }> = {
  top_performer: { bg: '#ecfdf5', text: '#059669' },
  interview_ready: { bg: '#ecfdf5', text: '#059669' },
  job_ready: { bg: '#eff6ff', text: '#2563eb' },
  developing: { bg: '#fffbeb', text: '#d97706' },
  beginner: { bg: '#fef2f2', text: '#dc2626' },
};

const CONFIDENCE_COLORS: Record<string, { bg: string; text: string }> = {
  high: { bg: '#ecfdf5', text: '#059669' },
  medium: { bg: '#fffbeb', text: '#d97706' },
  limited: { bg: '#fef2f2', text: '#dc2626' },
};

export default function HRDashboard({ navigation }: any) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    skills: '',
    min_confidence: '',
    min_practice_score: '',
    has_github: '',
    sort_by: 'overall_score',
  });

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { sort_by: filters.sort_by };
      if (filters.skills) params.skills = filters.skills;
      if (filters.min_confidence) params.min_confidence = filters.min_confidence;
      if (filters.min_practice_score) params.min_practice_score = filters.min_practice_score;
      if (filters.has_github) params.has_github = filters.has_github;

      const res = await apiClient.get('/hr/candidates', { params });
      setCandidates(res.data?.data || res.data || []);
    } catch (err) {
      console.log('Fetch Candidates Error:', err);
      setCandidates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCandidates();
  };

  const filtered = candidates.filter((c) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const nameMatch = c.full_name?.toLowerCase().includes(query);
    const skillMatch = c.skills?.some((s: string) => s?.toLowerCase().includes(query));
    return Boolean(nameMatch || skillMatch);
  });

  // Calculate top 4 metrics matching frontend
  const totalCount = filtered.length;
  const highConfidenceCount = filtered.filter((c) => c.confidence_label === 'high').length;
  const githubVerifiedCount = filtered.filter((c) => Number(c.total_repos || 0) > 0).length;
  const leetcodeActiveCount = filtered.filter((c) => Number(c.total_solved || 0) > 0).length;

  const getConfidenceBadge = (label?: string) => {
    const key = (label || '').toLowerCase();
    const color = CONFIDENCE_COLORS[key] || { bg: '#f1f5f9', text: '#64748b' };
    const displayLabel = key === 'high' ? 'High' : key === 'medium' ? 'Medium' : key === 'limited' ? 'Limited' : label || 'Verified';
    return { color, displayLabel };
  };

  const getReadinessBadge = (readiness?: string) => {
    if (!readiness) return null;
    const color = READINESS_COLORS[readiness] || { bg: '#f1f5f9', text: '#64748b' };
    const displayLabel = readiness.replace('_', ' ').toUpperCase();
    return { color, displayLabel };
  };

  return (
    <DashboardLayout title="Candidate Pool" scrollable={false}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f172a']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Section matching Frontend */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Candidate Pool</Text>
          <Text style={styles.heroSubtitle}>
            Browse verified candidates with evidence-backed scores
          </Text>
        </View>

        {/* Search and Filters Card */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Search size={16} color="#94a3b8" />
              <TextInput
                placeholder="Search name or skill..."
                placeholderTextColor="#94a3b8"
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
              {Boolean(search) && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal size={15} color={showFilters ? '#ffffff' : '#0f172a'} />
              <Text style={[styles.filterToggleText, showFilters && styles.filterToggleTextActive]}>
                Filters
              </Text>
            </TouchableOpacity>
          </View>

          {/* Expanded Filter Panel */}
          {Boolean(showFilters) && (
            <View style={styles.filtersPanel}>
              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>SKILLS</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="e.g. React, Python, Node.js"
                  placeholderTextColor="#94a3b8"
                  value={filters.skills}
                  onChangeText={(val) => setFilters((f) => ({ ...f, skills: val }))}
                />
              </View>

              <View style={styles.filterRow}>
                <View style={[styles.filterField, { flex: 1 }]}>
                  <Text style={styles.filterLabel}>MIN CONFIDENCE</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="0–100"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={filters.min_confidence}
                    onChangeText={(val) => setFilters((f) => ({ ...f, min_confidence: val }))}
                  />
                </View>
                <View style={[styles.filterField, { flex: 1 }]}>
                  <Text style={styles.filterLabel}>MIN PRACTICE SCORE</Text>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="0–100"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={filters.min_practice_score}
                    onChangeText={(val) => setFilters((f) => ({ ...f, min_practice_score: val }))}
                  />
                </View>
              </View>

              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>GITHUB VERIFICATION</Text>
                <View style={styles.pillRow}>
                  <TouchableOpacity
                    style={[styles.pillBtn, filters.has_github === '' && styles.pillBtnActive]}
                    onPress={() => setFilters((f) => ({ ...f, has_github: '' }))}
                  >
                    <Text style={[styles.pillBtnText, filters.has_github === '' && styles.pillBtnTextActive]}>
                      Any
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pillBtn, filters.has_github === 'true' && styles.pillBtnActive]}
                    onPress={() => setFilters((f) => ({ ...f, has_github: 'true' }))}
                  >
                    <Text style={[styles.pillBtnText, filters.has_github === 'true' && styles.pillBtnTextActive]}>
                      Has GitHub
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterField}>
                <Text style={styles.filterLabel}>SORT BY</Text>
                <View style={styles.sortGrid}>
                  {[
                    { id: 'overall_score', label: 'Confidence Score' },
                    { id: 'practice_score', label: 'Practice Score' },
                    { id: 'years_experience', label: 'Experience' },
                    { id: 'total_solved', label: 'LeetCode Solved' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.sortGridBtn, filters.sort_by === s.id && styles.sortGridBtnActive]}
                      onPress={() => setFilters((f) => ({ ...f, sort_by: s.id }))}
                    >
                      <Text style={[styles.sortGridText, filters.sort_by === s.id && styles.sortGridTextActive]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={styles.applyBtn} onPress={fetchCandidates}>
                <Filter size={15} color="#ffffff" />
                <Text style={styles.applyBtnText}>Apply Search & Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4 Stat Overview Cards matching Frontend */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalCount}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#059669' }]}>{highConfidenceCount}</Text>
            <Text style={styles.statLabel}>High Confidence</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#2563eb' }]}>{githubVerifiedCount}</Text>
            <Text style={styles.statLabel}>GitHub Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#d97706' }]}>{leetcodeActiveCount}</Text>
            <Text style={styles.statLabel}>LeetCode Active</Text>
          </View>
        </View>

        {/* Candidate List Section */}
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loaderText}>Loading candidate pool...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Briefcase size={36} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No candidates found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search query or filter options.</Text>
          </View>
        ) : (
          <View style={styles.candidateList}>
            {filtered.map((item) => {
              const conf = getConfidenceBadge(item.confidence_label);
              const read = getReadinessBadge(item.career_readiness);

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.candidateCard}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('CandidateDetail', { id: item.id })}
                >
                  {/* Left Avatar */}
                  <View style={styles.avatarWrap}>
                    {Boolean(item.photo_url) ? (
                      <Image source={{ uri: item.photo_url }} style={styles.avatarImg} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                          {(item.full_name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Middle Info */}
                  <View style={styles.candidateInfo}>
                    <View style={styles.nameBadgeRow}>
                      <Text style={styles.candidateName} numberOfLines={1}>
                        {item.full_name || 'Candidate'}
                      </Text>
                    </View>

                    {/* Badges Row */}
                    <View style={styles.badgesRow}>
                      {Boolean(item.confidence_label) && (
                        <View style={[styles.badge, { backgroundColor: conf.color.bg }]}>
                          <Text style={[styles.badgeText, { color: conf.color.text }]}>
                            {conf.displayLabel}
                          </Text>
                        </View>
                      )}
                      {Boolean(read) && (
                        <View style={[styles.badge, { backgroundColor: read?.color.bg }]}>
                          <Text style={[styles.badgeText, { color: read?.color.text }]}>
                            {read?.displayLabel}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Subtitle / Headline */}
                    <Text style={styles.headlineText} numberOfLines={1}>
                      {item.headline || item.location || 'Software Engineer'}
                    </Text>

                    {/* Skills Chips */}
                    {Boolean(item.skills && item.skills.length > 0) && (
                      <View style={styles.skillChipsWrap}>
                        {item.skills.slice(0, 4).map((s: string) => (
                          <View key={s} style={styles.skillChip}>
                            <Text style={styles.skillChipText}>{s}</Text>
                          </View>
                        ))}
                        {item.skills.length > 4 && (
                          <Text style={styles.moreSkillsText}>{`+${item.skills.length - 4}`}</Text>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Right Stats & Schedule */}
                  <View style={styles.metricsCol}>
                    <View style={styles.scoreBlock}>
                      <Text style={styles.scoreVal}>{item.overall_score ?? '—'}</Text>
                      <Text style={styles.scoreLabel}>Score</Text>
                    </View>

                    {Number(item.total_repos || 0) > 0 && (
                      <View style={styles.subMetricRow}>
                        <Github size={11} color="#64748b" />
                        <Text style={styles.subMetricVal}>{item.total_repos}</Text>
                      </View>
                    )}

                    {Number(item.total_solved || 0) > 0 && (
                      <View style={styles.subMetricRow}>
                        <Code2 size={11} color="#64748b" />
                        <Text style={styles.subMetricVal}>{item.total_solved}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.cardScheduleBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        navigation.navigate('CandidateDetail', { id: item.id, initialSchedule: true });
                      }}
                    >
                      <Calendar size={10} color="#0f172a" />
                      <Text style={styles.cardScheduleBtnText}>Schedule</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  searchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  filterToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterToggleBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  filterToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  filterToggleTextActive: {
    color: '#ffffff',
  },
  filtersPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  filterField: {
    gap: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  filterInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 12,
    color: '#0f172a',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pillBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  pillBtnTextActive: {
    color: '#ffffff',
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sortGridBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortGridBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  sortGridText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
  },
  sortGridTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    height: 42,
    borderRadius: 10,
    marginTop: 4,
  },
  applyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  candidateList: {
    gap: 10,
  },
  candidateCard: {
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
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  candidateInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
    justifyContent: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  headlineText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  skillChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 5,
    alignItems: 'center',
  },
  skillChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  skillChipText: {
    fontSize: 9,
    color: '#334155',
    fontWeight: '500',
  },
  moreSkillsText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metricsCol: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    gap: 2,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#94a3b8',
  },
  subMetricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  subMetricVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  cardScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardScheduleBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0f172a',
  },
});

