import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { CheckCircle, XCircle, ChevronLeft, Send } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';

export default function AssignmentTestScreen({ route, navigation }: any) {
  const { assignmentId, name } = route.params;
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState<any>(null);

  useEffect(() => {
    apiClient.get(`/practice/assignments/${assignmentId}`).then(res => {
      setQuestions(res.data || []);
    }).finally(() => setLoading(false));
  }, [assignmentId]);

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await apiClient.post('/practice/submit-assignment', {
        assignment_id: assignmentId,
        answers: answers
      });
      setScore(res.data);
      setDone(true);
    } catch {
      Alert.alert('Error', 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      Alert.alert(
        'Submit Test Early?',
        `You have answered ${answeredCount} of ${questions.length} questions. Do you want to submit your answers now?`,
        [
          { text: 'Continue Test', style: 'cancel' },
          { text: 'Submit Now', onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  if (loading) return <DashboardLayout title="Testing"><ActivityIndicator size="large" color="#0f172a" style={{ marginTop: 50 }} /></DashboardLayout>;

  return (
    <DashboardLayout title={name}>
      <ScrollView style={styles.container}>
        {done ? (
          <View style={styles.doneBox}>
             <CheckCircle size={80} color="#10b981" />
             <Text style={styles.doneTitle}>Test Submitted!</Text>
             <View style={styles.scoreCard}>
                <Text style={styles.scoreVal}>{score?.percentage}%</Text>
                <Text style={styles.scoreLab}>TOTAL SCORE</Text>
             </View>
             <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.goBack()}>
                <Text style={styles.btnTextWhite}>Back to Dashboard</Text>
             </TouchableOpacity>
          </View>
        ) : (
          <View>
             <Text style={styles.headerTitle}>{name}</Text>
             <Text style={styles.headerDesc}>Answer all questions below and submit.</Text>

             {questions.map((q, idx) => (
               <View key={q.id} style={styles.card}>
                  <View style={styles.qHeader}>
                     <View style={styles.qBadge}><Text style={styles.qBadgeText}>{idx + 1}</Text></View>
                     <Text style={styles.qTitle}>{q.title}</Text>
                  </View>
                  <Text style={styles.qDesc}>{q.description}</Text>

                  {q.question_type === 'mcq' && (typeof q.options === 'string' ? JSON.parse(q.options) : q.options || []).map((opt: any) => (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.option, answers[q.id] === opt.id && styles.optionSelected]}
                      onPress={() => setAnswers({...answers, [q.id]: opt.id})}
                    >
                       <Text style={[styles.optionText, answers[q.id] === opt.id && styles.textBold]}>
                         {opt.id.toUpperCase()}. {opt.text}
                       </Text>
                    </TouchableOpacity>
                  ))}

                  {q.question_type !== 'mcq' && (
                    <TextInput
                      style={styles.textArea}
                      multiline
                      placeholder="Type your answer..."
                      value={answers[q.id] || ''}
                      onChangeText={t => setAnswers({...answers, [q.id]: t})}
                    />
                  )}
               </View>
             ))}

             <TouchableOpacity style={styles.btnSubmit} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Send size={18} color="#fff" />
                    <Text style={styles.btnTextWhite}>Submit All Answers</Text>
                  </>
                )}
             </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  headerDesc: { fontSize: 14, color: '#64748b', marginTop: 5, marginBottom: 25 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 20, marginBottom: 20, elevation: 1 },
  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  qBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center' },
  qBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  qTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  qDesc: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 20 },
  option: { padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 8 },
  optionSelected: { backgroundColor: '#f1f5f9', borderColor: '#0f172a', borderWidth: 2 },
  optionText: { fontSize: 13, color: '#1e293b' },
  textBold: { fontWeight: 'bold' },
  textArea: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, height: 100, borderWidth: 1, borderColor: '#e2e8f0' },
  btnSubmit: { backgroundColor: '#0f172a', padding: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10, marginBottom: 40 },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  doneBox: { alignItems: 'center', marginTop: 80 },
  doneTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginTop: 20 },
  scoreCard: { backgroundColor: '#fff', padding: 30, borderRadius: 24, alignItems: 'center', marginVertical: 30, elevation: 2, minWidth: 200 },
  scoreVal: { fontSize: 48, fontWeight: '900', color: '#0f172a' },
  scoreLab: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 1, marginTop: 5 },
  btnPrimary: { backgroundColor: '#0f172a', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 }
});
