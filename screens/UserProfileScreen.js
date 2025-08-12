import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE_URL, AVATAR_PLACEHOLDER, toImageUrl } from '../config';

export default function UserProfileScreen() {
  const { userId, user_id } = useRoute().params || {};
  const uid = userId || user_id;
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUser = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/users/${uid}`);
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!uid) { setError('No user ID provided'); setLoading(false); }
    else loadUser();
  }, [uid]);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#6C63FF" /></View>;

  if (error) return (
    <View style={styles.centered}>
      <Text style={styles.error}>{error}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  if (!user) return null;

  const avatarUri = toImageUrl(user.avatarUrl);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={avatarUri ? { uri: avatarUri } : AVATAR_PLACEHOLDER} style={styles.avatar} />
      <Text style={styles.username}>{user.name}</Text>
      <Text style={styles.info}>{user.email || 'No email provided'}</Text>
      <Text style={styles.info}>{user.phone || 'No phone number provided'}</Text>
      <Text style={styles.info}>Coins: {user.coins}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingTop: 40, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
  username: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  info: { fontSize: 16, color: 'gray', marginBottom: 8 },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
  btn: { backgroundColor: '#6C63FF', borderRadius: 24, height: 48, paddingHorizontal: 32, justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' }
});