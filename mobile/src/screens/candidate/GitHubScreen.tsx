import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import {
  Github,
  RefreshCw,
  GitBranch,
  Star,
  GitCommit,
  Users,
  CheckCircle,
  ExternalLink,
  Code2,
} from 'lucide-react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function LanguageRadarChart({ languages }: { languages: Record<string, number> | string[] }) {
  if (!languages) return null;

  let entries: [string, number][] = [];
  if (Array.isArray(languages)) {
    entries = languages.slice(0, 6).map((lang, i): [string, number] => [String(lang), Math.max(20, 100 - i * 15)]);
  } else if (typeof languages === 'object') {
    entries = Object.entries(languages)
      .filter(([_, val]) => typeof val === 'number' || !isNaN(Number(val)))
      .map(([k, v]): [string, number] => [k, Number(v)])
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 6);
  }

  if (entries.length < 3) {
    if (entries.length === 0) return null;
    while (entries.length < 3) {
      entries.push(['', 0]);
    }
  }

  const chartWidth = Math.min(SCREEN_WIDTH - 64, 330);
  const chartHeight = 240;
  const cx = chartWidth / 2;
  const cy = chartHeight / 2;
  const radius = 75;

  const N = entries.length;
  const maxVal = Math.max(...entries.map((e) => e[1]), 1);

  const angles = entries.map((_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / N);
  const levels = [0.25, 0.5, 0.75, 1.0];

  const dataPoints = entries.map(([_, val], i) => {
    const norm = Math.max(0.18, val / maxVal);
    const r = norm * radius;
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    return { x, y, rawVal: val };
  });

  const polygonPointsStr = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={styles.radarCard}>
      <Text style={styles.radarCardTitle}>LANGUAGE ACTIVITY</Text>
      <View style={styles.radarChartWrap}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Concentric grid webs */}
          {levels.map((level, lvlIdx) => {
            const gridPts = angles
              .map((angle) => {
                const x = cx + radius * level * Math.cos(angle);
                const y = cy + radius * level * Math.sin(angle);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(' ');

            return (
              <Polygon
                key={`grid-${lvlIdx}`}
                points={gridPts}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            );
          })}

          {/* Radial axis lines */}
          {angles.map((angle, i) => {
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            return (
              <Line
                key={`spoke-${i}`}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            );
          })}

          {/* Radar Data Polygon */}
          <Polygon
            points={polygonPointsStr}
            fill="#3b82f6"
            fillOpacity={0.25}
            stroke="#1d4ed8"
            strokeWidth={2}
          />

          {/* Data point dots */}
          {dataPoints.map((pt, i) => (
            <Circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3.5}
              fill="#1d4ed8"
              stroke="#ffffff"
              strokeWidth={1.5}
            />
          ))}

          {/* Language Labels */}
          {entries.map(([label], i) => {
            if (!label) return null;
            const labelR = radius + 20;
            const lx = cx + labelR * Math.cos(angles[i]);
            const ly = cy + labelR * Math.sin(angles[i]) + 4;

            return (
              <SvgText
                key={`lbl-${i}`}
                x={lx}
                y={ly}
                fontSize={10}
                fontWeight="600"
                fill="#475569"
                textAnchor="middle"
              >
                {label.length > 13 ? `${label.substring(0, 11)}...` : label}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    </View>
  );
}

export default function GitHubScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');

  const fetchData = async () => {
    try {
      const [ghRes, profRes] = await Promise.all([
        apiClient.get('/github/data').catch(() => ({ data: null })),
        apiClient.get('/profile').catch(() => ({ data: null })),
      ]);
      const ghData = ghRes.data;
      setData(ghData);
      const url = ghData?.github_url || profRes.data?.profile?.github_url || '';
      if (url) setGithubUrl(url);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async () => {
    const urlToUse = githubUrl.trim();
    if (!urlToUse) {
      return Alert.alert('Notice', 'Please enter your GitHub profile URL or username.');
    }
    setVerifying(true);
    try {
      const res = await apiClient.post('/github/verify', { github_url: urlToUse });
      setData(res.data);
      Alert.alert('Success', 'GitHub activity verified successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'GitHub verification failed. Please check the username/URL.');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="GitHub">
        <ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="GitHub Verification">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Link input card */}
        <View style={styles.inputCard}>
          <View style={styles.inputHeader}>
            <Github size={18} color="#0f172a" />
            <Text style={styles.inputTitle}>GitHub Profile Link / Username</Text>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={githubUrl}
              onChangeText={setGithubUrl}
              placeholder="e.g. https://github.com/username"
              placeholderTextColor="#94a3b8"
              style={styles.textInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.btnVerify, verifying && styles.btnDisabled]}
              onPress={handleVerify}
              disabled={verifying}
            >
              {verifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnVerifyText}>{data?.skill_match_score ? 'Re-verify' : 'Verify'}</Text>
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.inputHint}>Enter your GitHub username or full profile URL.</Text>
        </View>

        {!data || !data.skill_match_score ? (
          <View style={styles.emptyState}>
            <Github size={56} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Not Verified Yet</Text>
            <Text style={styles.emptyDesc}>
              Enter your GitHub URL above and tap Verify to extract your repositories, commits, and language activity.
            </Text>
          </View>
        ) : (
          <View>
            {/* Header Score Card */}
            <View style={styles.header}>
              <Text style={styles.scoreLabel}>SKILL MATCH SCORE</Text>
              <Text style={styles.scoreVal}>
                {data.skill_match_score}
                <Text style={styles.scoreMax}>/100</Text>
              </Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${data.skill_match_score}%` }]} />
              </View>
              <Text style={styles.lastUpdatedText}>
                Verified user: @{data.github_username || data.username || 'user'}
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {[
                { icon: GitBranch, label: 'Repos', val: data.total_repos },
                { icon: Star, label: 'Stars', val: data.total_stars },
                { icon: GitCommit, label: 'Commits', val: data.total_commits },
                { icon: Users, label: 'Followers', val: data.followers },
              ].map((item, idx) => (
                <View key={idx} style={styles.statBox}>
                  <item.icon size={16} color="#64748b" />
                  <Text style={styles.statVal}>{item.val || 0}</Text>
                  <Text style={styles.statLab}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Language Activity Radar Chart */}
            {(data.languages || data.top_languages) && (
              <LanguageRadarChart languages={data.languages || data.top_languages} />
            )}

            {/* Top Repositories */}
            {data.top_repos && data.top_repos.length > 0 && (
              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Top Repositories</Text>
                {data.top_repos.map((repo: any) => (
                  <View key={repo.name} style={styles.repoCard}>
                    <View style={styles.repoHeader}>
                      <Text style={styles.repoName}>{repo.name}</Text>
                      <View style={styles.starRow}>
                        <Star size={12} color="#f59e0b" />
                        <Text style={styles.starText}>{repo.stars}</Text>
                      </View>
                    </View>
                    {repo.description ? (
                      <Text style={styles.repoDesc} numberOfLines={2}>
                        {repo.description}
                      </Text>
                    ) : null}
                    {repo.language && (
                      <View style={styles.langBadge}>
                        <Text style={styles.langText}>{repo.language}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 60, backgroundColor: '#f8fafc' },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  inputHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inputTitle: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  textInput: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnVerify: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  btnDisabled: { opacity: 0.7 },
  btnVerifyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  inputHint: { fontSize: 11, color: '#94a3b8', marginTop: 8 },

  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 16 },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },

  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  scoreLabel: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1 },
  scoreVal: { fontSize: 38, fontWeight: '900', color: '#0f172a', marginVertical: 6 },
  scoreMax: { fontSize: 18, color: '#cbd5e1' },
  barBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#3b82f6' },
  lastUpdatedText: { fontSize: 12, color: '#64748b', fontWeight: '500', marginTop: 12 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginTop: 5 },
  statLab: { fontSize: 11, color: '#94a3b8' },

  radarCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  radarCardTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  radarChartWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },

  sectionWrap: { marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  repoCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  repoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  repoName: { fontSize: 14, fontWeight: 'bold', color: '#1e293b', flex: 1, marginRight: 8 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starText: { fontSize: 11, color: '#64748b' },
  repoDesc: { fontSize: 12, color: '#64748b', marginTop: 4 },
  langBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 8,
  },
  langText: { fontSize: 10, color: '#475569', fontWeight: 'bold' },
});
