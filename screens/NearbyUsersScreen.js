import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';
import { API_BASE_URL } from '../config'
const back = API_BASE_URL

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

const NearbyUsersScreen = ({ navigation, route }) => {
  const { user_id } = route.params;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    let isActive = true;
    async function fetchNearby() {
      setLoading(true);
      try {
        const { coords } = await getCurrentPosition();
        const resp = await fetch(`${back}/users/nearby?lat=${coords.latitude}&lon=${coords.longitude}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (isActive) setUsers(data);
      } catch (e) {
        if (isActive) setError(e.message || 'Positioning or network failure');
      } finally {
        if (isActive) setLoading(false);
      }
    }
    if (isFocused) fetchNearby();
    return () => { isActive = false; };
  }, [isFocused]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('Chat', { user_id, peer_id: item.id, peerName: item.name })}
    >
      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.lastSeen}>{item.lastSeen}</Text>
      </View>
    </TouchableOpacity>
  );
  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  return (
    <View style={styles.container}>
      {users.length === 0 ? (
        <Text style={styles.empty}>No nearby users found.</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

export default NearbyUsersScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { flex: 1, color: 'red', textAlign: 'center', marginTop: 20 },
  empty: { flex: 1, textAlign: 'center', marginTop: 20 },
  list: { padding: 16 },
  userItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  lastSeen: { color: '#666', marginTop: 4 },
});
