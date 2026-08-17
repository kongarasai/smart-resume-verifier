import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import {
  Briefcase,
  Search,
  Zap,
  ExternalLink,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Building,
  MapPin,
  Clock,
  Globe,
} from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

type Tab = 'matched' | 'all';

export default function JobsScreen() {
  const [tab, setTab] = useState<Tab>('matched');
  const [jobs, setJobs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  // Analyzer States
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const loadJobs = useCallback(async (t: Tab = tab, p = page, q = search) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/jobs', {
        params: {
          tab: t,
          page: p,
          limit: 15,
          search: q ? q.trim() : undefined,
        },
      });
      setJobs(res.data.jobs || []);
      setTotal(res.data.total || 0);
      setMessage(res.data.message || '');
    } catch (err: any) {
      console.log('Error loading jobs:', err?.message);
      setJobs([]);
      setMessage('Failed to load jobs. Please try refreshing.');
    } finally {
      setLoading(false);
    }
  }, [tab, page, search]);

  useEffect(() => {
    loadJobs(tab, 1, search);
  }, [tab]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setPage(1);
    setSearch('');
  };

  const doSearch = () => {
    setPage(1);
    loadJobs(tab, 1, search);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await apiClient.post('/jobs/refresh');
      Alert.alert('Success', res.data.message || 'Jobs refreshed successfully!');
      loadJobs(tab, 1, search);
    } catch (err: any) {
      Alert.alert('Notice', err.response?.data?.error || 'Failed to refresh jobs from external sources.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!analyzeInput.trim()) return;
    setAnalyzing(true);
    try {
      const res = await apiClient.post('/jobs/analyze', { job_title: analyzeInput.trim() });
      setAnalysis(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to analyze job role.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async (url: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this URL: ' + url);
      }
    } catch {
      Alert.alert('Error', 'Failed to open application page.');
    }
  };

  const totalPages = Math.ceil(total / 15);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
      case 'medium':
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
      default:
        return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
    }
  };

  const renderJobCard = (job: any, index: number) => {
    const matchPct = job.match_pct;
    const isHighMatch = matchPct >= 70;
    const isMedMatch = matchPct >= 40 && matchPct < 70;

    return (
      <View key={job.id || `job-${index}`} style={styles.jobCard}>
        {/* Header: Title & Badges */}
        <View style={styles.jobHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.jobTitle}>{job.title}</Text>
            <View style={styles.metaRow}>
              {job.company && (
                <View style={styles.metaItem}>
                  <Building size={12} color="#64748b" />
                  <Text style={styles.metaText}>{job.company}</Text>
                </View>
              )}
              {job.location && (
                <View style={styles.metaItem}>
                  <MapPin size={12} color="#64748b" />
                  <Text style={styles.metaText}>{job.location}</Text>
                </View>
              )}
              {job.job_type && (
                <View style={styles.metaItem}>
                  <Clock size={12} color="#64748b" />
                  <Text style={styles.metaText}>{job.job_type}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.badgeColumn}>
            {matchPct != null && (
              <View
                style={[
                  styles.matchBadge,
                  {
                    backgroundColor: isHighMatch ? '#ecfdf5' : isMedMatch ? '#fffbeb' : '#fef2f2',
                    borderColor: isHighMatch ? '#a7f3d0' : isMedMatch ? '#fde68a' : '#fecaca',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.matchText,
                    { color: isHighMatch ? '#047857' : isMedMatch ? '#b45309' : '#b91c1c' },
                  ]}
                >
                  {matchPct}% match
                </Text>
              </View>
            )}
            {job.source_platform && (
              <View style={styles.platformBadge}>
                <Globe size={10} color="#64748b" />
                <Text style={styles.platformText}>{job.source_platform.toUpperCase()}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Required Skills Chips */}
        {job.required_skills && job.required_skills.length > 0 && (
          <View style={styles.skillSection}>
            <Text style={styles.chipSectionLabel}>REQUIRED SKILLS</Text>
            <View style={styles.skillRow}>
              {job.required_skills.slice(0, 6).map((skill: string, sIdx: number) => {
                const isMatched = job.matched?.includes(skill);
                return (
                  <View
                    key={skill || sIdx}
                    style={[
                      styles.skillChip,
                      isMatched && styles.matchedSkillChip,
                    ]}
                  >
                    {isMatched && <Check size={10} color="#059669" style={{ marginRight: 3 }} />}
                    <Text style={[styles.skillChipText, isMatched && styles.matchedSkillChipText]}>
                      {skill}
                    </Text>
                  </View>
                );
              })}
              {job.required_skills.length > 6 && (
                <View style={styles.moreChip}>
                  <Text style={styles.moreChipText}>+{job.required_skills.length - 6} more</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Missing Skills (in Matched view) */}
        {tab === 'matched' && job.missing && job.missing.length > 0 && (
          <View style={styles.missingSection}>
            <Text style={styles.missingLabel}>MISSING:</Text>
            <View style={styles.missingRow}>
              {job.missing.slice(0, 3).map((m: any, mIdx: number) => {
                const pStyle = getPriorityStyle(m.priority);
                return (
                  <View
                    key={m.skill || mIdx}
                    style={[
                      styles.missingChip,
                      { backgroundColor: pStyle.bg, borderColor: pStyle.border },
                    ]}
                  >
                    <Text style={[styles.missingChipText, { color: pStyle.text }]}>
                      {m.skill} ({m.priority})
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Apply Action */}
        {job.apply_url && (
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => handleApply(job.apply_url)}
            activeOpacity={0.8}
          >
            <Text style={styles.applyBtnText}>Apply Now</Text>
            <ExternalLink size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <DashboardLayout title="Jobs">
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Page Header */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Live Tech Jobs</Text>
            <Text style={styles.pageSub}>
              Aggregated from Remotive, Jobicy, Arbeitnow & Himalayas
            </Text>
          </View>
          <TouchableOpacity
            style={styles.refreshHeaderBtn}
            onPress={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#0f172a" />
            ) : (
              <>
                <RefreshCw size={14} color="#0f172a" />
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Job Role Analyzer Card */}
        <View style={styles.analyzerBox}>
          <View style={styles.analyzerHeader}>
            <Zap size={18} color="#f59e0b" />
            <Text style={styles.boxTitle}>Job Role Analyzer</Text>
          </View>
          <Text style={styles.analyzerSub}>
            Check your profile readiness and required skills for any tech role
          </Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. Full Stack Developer, Java Engineer..."
              placeholderTextColor="#94a3b8"
              value={analyzeInput}
              onChangeText={setAnalyzeInput}
              onSubmitEditing={handleAnalyze}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.analyzeBtn}
              onPress={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Search size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>

          {analysis && (
            <View style={styles.analysisResult}>
              <View style={styles.scoreHeader}>
                <View style={styles.scoreBarContainer}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      {
                        width: `${analysis.match_pct}%`,
                        backgroundColor:
                          analysis.match_pct >= 70
                            ? '#10b981'
                            : analysis.match_pct >= 40
                            ? '#f59e0b'
                            : '#ef4444',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.matchSummary}>{analysis.match_pct}% Match</Text>
              </View>

              {/* Skills You Have */}
              <Text style={styles.miniLabel}>✓ SKILLS YOU HAVE</Text>
              <View style={styles.chipRow}>
                {analysis.matched && analysis.matched.length > 0 ? (
                  analysis.matched.map((s: string, mIdx: number) => (
                    <View key={s || mIdx} style={styles.greenChip}>
                      <Text style={styles.greenChipText}>{s}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyChipNote}>None matched — add skills to your profile</Text>
                )}
              </View>

              {/* Skills You Need */}
              <Text style={styles.miniLabel}>✗ SKILLS TO LEARN</Text>
              <View style={styles.chipRow}>
                {analysis.missing && analysis.missing.length > 0 ? (
                  analysis.missing.map((m: any, missIdx: number) => {
                    const pStyle = getPriorityStyle(m.priority);
                    return (
                      <View
                        key={m.skill || missIdx}
                        style={[
                          styles.missingChip,
                          { backgroundColor: pStyle.bg, borderColor: pStyle.border },
                        ]}
                      >
                        <Text style={[styles.missingChipText, { color: pStyle.text }]}>
                          {m.skill} ({m.priority})
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.successNote}>You have all required skills! 🎉</Text>
                )}
              </View>

              {/* Nice to have */}
              {analysis.nice_to_have && analysis.nice_to_have.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.miniLabel}>NICE TO HAVE</Text>
                  <Text style={styles.niceText}>{analysis.nice_to_have.join(', ')}</Text>
                </View>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <View style={styles.recomBox}>
                  {analysis.recommendations.map((rec: string, rIdx: number) => (
                    <Text key={rIdx} style={styles.recomText}>
                      → {rec}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, tab === 'matched' && styles.activeTabButton]}
            onPress={() => switchTab('matched')}
          >
            <Text style={[styles.tabText, tab === 'matched' && styles.activeTabText]}>
              ⚡ Skills Matched
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, tab === 'all' && styles.activeTabButton]}
            onPress={() => switchTab('all')}
          >
            <Text style={[styles.tabText, tab === 'all' && styles.activeTabText]}>
              📋 All Opportunities
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search in Jobs */}
        <View style={styles.jobSearchBar}>
          <TextInput
            style={styles.jobSearchInput}
            placeholder="Search by title, role or company..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={doSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.jobSearchBtn} onPress={doSearch}>
            <Search size={16} color="#0f172a" />
          </TouchableOpacity>
        </View>

        {/* Jobs Count Info */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {total > 0 ? `${total} opportunities found` : 'Jobs'}
          </Text>
          {page > 1 && <Text style={styles.countText}>Page {page} of {totalPages}</Text>}
        </View>

        {/* Jobs List */}
        {loading ? (
          <View style={styles.loaderArea}>
            <ActivityIndicator size="large" color="#0f172a" />
            <Text style={styles.loaderText}>Finding best job matches...</Text>
          </View>
        ) : jobs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Briefcase size={44} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>
              {tab === 'matched' ? 'No Matched Jobs Yet' : 'No Jobs Found'}
            </Text>
            <Text style={styles.emptyDesc}>
              {message || (tab === 'matched'
                ? 'Add verified skills in your Profile to match with real-world openings.'
                : 'Try adjusting your search query or refresh jobs to fetch latest listings.')}
            </Text>
            {tab === 'matched' && (
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => switchTab('all')}
              >
                <Text style={styles.btnSecondaryText}>Browse All Jobs</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.btnSecondary, { marginTop: 8 }]}
              onPress={handleRefresh}
            >
              <RefreshCw size={14} color="#0f172a" style={{ marginRight: 6 }} />
              <Text style={styles.btnSecondaryText}>Fetch Fresh Jobs</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {jobs.map((job, index) => renderJobCard(job, index))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                  onPress={() => {
                    if (page > 1) {
                      const newP = page - 1;
                      setPage(newP);
                      loadJobs(tab, newP, search);
                    }
                  }}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} color={page === 1 ? '#cbd5e1' : '#0f172a'} />
                  <Text style={[styles.pageBtnText, page === 1 && styles.pageBtnTextDisabled]}>
                    Prev
                  </Text>
                </TouchableOpacity>

                <Text style={styles.pageIndicator}>
                  {page} / {totalPages}
                </Text>

                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages && styles.pageBtnDisabled]}
                  onPress={() => {
                    if (page < totalPages) {
                      const newP = page + 1;
                      setPage(newP);
                      loadJobs(tab, newP, search);
                    }
                  }}
                  disabled={page >= totalPages}
                >
                  <Text style={[styles.pageBtnText, page >= totalPages && styles.pageBtnTextDisabled]}>
                    Next
                  </Text>
                  <ChevronRight size={16} color={page >= totalPages ? '#cbd5e1' : '#0f172a'} />
                </TouchableOpacity>
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
    padding: 16,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  pageSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  refreshHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  analyzerBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  analyzerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  analyzerSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  analyzeBtn: {
    backgroundColor: '#0f172a',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  analysisResult: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
  },
  matchSummary: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  greenChip: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  greenChipText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '600',
  },
  missingChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  missingChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyChipNote: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  successNote: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  niceText: {
    fontSize: 11,
    color: '#64748b',
  },
  recomBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    gap: 4,
  },
  recomText: {
    fontSize: 11,
    color: '#475569',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTabButton: {
    backgroundColor: '#fff',
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  jobSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  jobSearchInput: {
    flex: 1,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0f172a',
  },
  jobSearchBtn: {
    padding: 6,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
  },
  badgeColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  matchBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  matchText: {
    fontSize: 10,
    fontWeight: '700',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  skillSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  chipSectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  matchedSkillChip: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  skillChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  matchedSkillChipText: {
    color: '#047857',
    fontWeight: '600',
  },
  moreChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  moreChipText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  missingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  missingLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  missingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  applyBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  applyBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  loaderArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loaderText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
    paddingVertical: 10,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  pageBtnDisabled: {
    backgroundColor: '#f8fafc',
    borderColor: '#f1f5f9',
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  pageBtnTextDisabled: {
    color: '#cbd5e1',
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
});
