import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Send, MessageSquare, Lock, ChevronLeft, Calendar } from 'lucide-react-native';
import DashboardLayout from '../../components/shared/DashboardLayout';
import apiClient from '../../api/apiClient';
import { useAuthStore } from '../../store/authStore';
import { io, Socket } from 'socket.io-client';

export default function MessagesScreen() {
  const { user, token } = useAuthStore();
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const SOCKET_URL = 'http://192.168.1.10:5000';
    socketRef.current = io(SOCKET_URL, { auth: { token } });
    socketRef.current.on('new_message', (msg: any) => {
      if (activeUser && (msg.sender_id === activeUser.id || msg.receiver_id === activeUser.id)) {
        setMessages(prev => [...prev, msg]);
      }
    });

    fetchContacts();
    return () => { socketRef.current?.disconnect(); };
  }, [activeUser]);

  const fetchContacts = async () => {
    try {
      const res = await apiClient.get('/interview-contacts');
      setContacts(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  const openChat = async (contact: any) => {
    setActiveUser(contact);
    try {
      const res = await apiClient.get(`/messages/${contact.id}`);
      setMessages(res.data);
    } catch {}
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeUser) return;
    try {
      const res = await apiClient.post('/messages', { receiver_id: activeUser.id, content: input.trim() });
      setMessages(prev => [...prev, res.data]);
      setInput('');
    } catch {}
  };

  const renderContact = ({ item }: any) => (
    <TouchableOpacity style={styles.contactCard} onPress={() => openChat(item)}>
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarTextSmall}>{item.full_name?.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactName}>{item.full_name}</Text>
        <Text style={styles.contactSubtitle}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: any) => {
    const isMine = item.sender_id === user?.id;
    return (
      <View style={[styles.msgContainer, isMine ? styles.msgMine : styles.msgTheirs]}>
        <View style={[styles.msgBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.msgText, isMine && styles.textWhite]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <DashboardLayout title="Messages" scrollable={false}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {!activeUser ? (
          <View style={styles.listContainer}>
             <View style={styles.lockNotice}>
                <Lock size={16} color="#64748b" />
                <Text style={styles.lockText}>Message HR after an interview is scheduled.</Text>
             </View>
             {loading ? <ActivityIndicator color="#0f172a" /> : (
               <FlatList
                 data={contacts}
                 renderItem={renderContact}
                 keyExtractor={item => item.id}
                 ListEmptyComponent={
                    <View style={styles.empty}>
                       <Calendar size={48} color="#cbd5e1" />
                       <Text style={styles.emptyText}>No interviewers found yet.</Text>
                    </View>
                 }
               />
             )}
          </View>
        ) : (
          <View style={styles.chatContainer}>
            <TouchableOpacity style={styles.chatHeader} onPress={() => setActiveUser(null)}>
               <ChevronLeft size={20} color="#0f172a" />
               <Text style={styles.chatHeaderName}>{activeUser.full_name}</Text>
            </TouchableOpacity>
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, idx) => idx.toString()}
              contentContainerStyle={{ padding: 15 }}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Message..."
                value={input}
                onChangeText={setInput}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Send size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </DashboardLayout>
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 20 },
  lockNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 12, marginBottom: 20 },
  lockText: { fontSize: 12, color: '#64748b' },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, elevation: 1 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  avatarTextSmall: { fontSize: 16, fontWeight: 'bold', color: '#475569' },
  contactName: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  contactSubtitle: { fontSize: 12, color: '#94a3b8' },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', marginTop: 10, textAlign: 'center' },
  chatContainer: { flex: 1, backgroundColor: '#f8fafc' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  chatHeaderName: { fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  msgContainer: { marginVertical: 4, flexDirection: 'row' },
  msgMine: { justifyContent: 'flex-end' },
  msgTheirs: { justifyContent: 'flex-start' },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: 20 },
  bubbleMine: { backgroundColor: '#0f172a', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#e2e8f0', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, color: '#1e293b' },
  textWhite: { color: '#fff' },
  inputRow: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 10 },
  chatInput: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 },
  sendBtn: { backgroundColor: '#0f172a', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }
});
