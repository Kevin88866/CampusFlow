import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
const back = 'http://192.168.78.188:3000';

export default function UserProfileScreen() {
  const route = useRoute();
  const navi = useNavigation();
  const { userId, user_id } = route.params || {};
  const uid = userId || user_id;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetch = async () => {
    try {
      const resp = await fetch(`${back}/users/${uid}`);
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!uid) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }
    fetch();
  }, [uid]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={'#6C63FF'} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navi.goBack()}>
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {user.avatarUrl && (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      )}
      <Text style={styles.username}>{user.name}</Text>
      <Text style={styles.info}>{user.phone || 'No phone number provided'}</Text>
      <Text style={styles.info}>Coins: {user.coins}</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navi.goBack()}>
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
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
});
