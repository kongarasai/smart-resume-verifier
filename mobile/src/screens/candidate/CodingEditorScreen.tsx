import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Play, Send, ChevronLeft, AlertOctagon } from 'lucide-react-native';
import apiClient from '../../api/apiClient';

export default function CodingEditorScreen({ route, navigation }: any) {
  const { language = 'JavaScript' } = route.params || {};
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState('// Write your code here...');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    apiClient.post('/practice/start', { category: 'coding' }).then(res => {
      setQuestions(res.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await apiClient.post('/practice/run-code', { language, code });
      setOutput(res.data.stdout || res.data.stderr || 'No output');
    } catch {
      setOutput('Execution Error');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await apiClient.post('/practice/submit', {
        question_id: questions[currentIdx].id,
        submitted_answer: code
      });
      Alert.alert('Success', 'Solution submitted!');
      if (currentIdx < questions.length - 1) setCurrentIdx(currentIdx + 1);
      else navigation.goBack();
    } catch {
      Alert.alert('Error', 'Submission failed');
    }
  };

  if (loading) return <View style={styles.loader}><ActivityIndicator size="large" color="#fff" /></View>;

  const q = questions[currentIdx];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
         <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft color="#fff" /></TouchableOpacity>
         <Text style={styles.headerTitle}>{language} Sandbox</Text>
         <Text style={styles.qCount}>{currentIdx + 1}/{questions.length}</Text>
      </View>

      <View style={styles.problemBox}>
         <Text style={styles.problemTitle}>{q?.title}</Text>
         <ScrollView style={styles.descScroll}><Text style={styles.problemDesc}>{q?.description}</Text></ScrollView>
      </View>

      <TextInput
        style={styles.editor}
        multiline
        value={code}
        onChangeText={setCode}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
      />

      <View style={styles.terminal}>
         <View style={styles.termHeader}>
            <Text style={styles.termTitle}>TERMINAL</Text>
            <View style={styles.termBtns}>
               <TouchableOpacity style={styles.runBtn} onPress={handleRun}>
                  {running ? <ActivityIndicator size="small" color="#fff" /> : <Play size={14} color="#fff" />}
                  <Text style={styles.btnText}>Run</Text>
               </TouchableOpacity>
               <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                  <Send size={14} color="#fff" />
                  <Text style={styles.btnText}>Submit</Text>
               </TouchableOpacity>
            </View>
         </View>
         <ScrollView style={styles.outputScroll}>
            <Text style={styles.outputText}>{output || '// Run code to see output...'}</Text>
         </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  loader: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { color: '#fff', fontWeight: 'bold' },
  qCount: { color: '#64748b', fontSize: 12 },
  problemBox: { height: 150, padding: 15, backgroundColor: '#1e293b' },
  problemTitle: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
  descScroll: { flex: 1 },
  problemDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
  editor: { flex: 1, backgroundColor: '#000', color: '#fff', padding: 15, fontFamily: 'monospace', fontSize: 14, textAlignVertical: 'top' },
  terminal: { height: 200, backgroundColor: '#111', borderTopWidth: 1, borderTopColor: '#334155' },
  termHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#0f172a' },
  termTitle: { color: '#64748b', fontSize: 10, fontWeight: 'bold' },
  termBtns: { flexDirection: 'row', gap: 10 },
  runBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  outputScroll: { padding: 15 },
  outputText: { color: '#10b981', fontFamily: 'monospace', fontSize: 12 }
});
