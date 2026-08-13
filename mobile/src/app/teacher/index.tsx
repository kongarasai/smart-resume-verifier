import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { HeaderBar } from '../../components/HeaderBar';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Colors } from '../../theme/colors';
import { teacherAPI } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Plus, FileText } from 'lucide-react-native';

export default function TeacherDashboard() {
  const { user } = useAuthStore();
  const [questionTitle, setQuestionTitle] = useState('');

  const handleAddQuestion = async () => {
    if (!questionTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a problem statement.');
      return;
    }
    try {
      await teacherAPI.createQuestion({
        title: questionTitle.trim(),
        category: 'Data Structures',
        difficulty: 'Medium',
      });
      Alert.alert('Success', 'Question added to practice bank!');
      setQuestionTitle('');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to add question.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <HeaderBar title="Teacher Portal" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.welcomeRow}>
          <View>
            <Text style={styles.greetingText}>Welcome back, Teacher</Text>
            <Text style={styles.nameText}>{user?.full_name || 'Teacher'}</Text>
          </View>
          <Badge label="Teacher Role" variant="green" />
        </View>

        <Text style={styles.sectionHeader}>Question Bank</Text>

        <Card>
          <View style={styles.iconTitleRow}>
            <Plus color={Colors.accent} size={20} />
            <Text style={styles.cardTitle}>Add Practice Question</Text>
          </View>
          <TextInput
            style={styles.input}
            value={questionTitle}
            onChangeText={setQuestionTitle}
            placeholder="Enter problem title..."
            placeholderTextColor={Colors.ink[500]}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddQuestion}>
            <Text style={styles.addBtnText}>Create Question</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  greetingText: { fontSize: 13, color: Colors.ink[400] },
  nameText: { fontSize: 22, fontWeight: 'bold', color: Colors.ink[50] },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50], marginTop: 12, marginBottom: 12 },
  iconTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.ink[50] },
  input: { backgroundColor: Colors.ink[950], borderRadius: 10, padding: 12, color: Colors.ink[50], fontSize: 14, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  addBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: Colors.ink[950], fontWeight: 'bold', fontSize: 14 },
});
