import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, AVATAR_PLACEHOLDER, toImageUrl } from '../config';
import { startLocationPrefetch } from '../location';

const CACHE_KEY = 'last_location';

export default function NearbyUsersScreen({ navigation, route }) {
  const { user_id } = route.params;
  const isFocused = useIsFocused();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { startLocationPrefetch(); }, []);
  useEffect(() => { if (isFocused) load(); }, [isFocused]);

  async function getQuickCoords() {
    const m = global.__lastLocation;
    if (m && isFinite(m.lat) && isFinite(m.lon) && (m.lat || m.lon)) return { lat: m.lat, lon: m.lon };
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (typeof o.lat === 'number' && typeof o.lon === 'number' && isFinite(o.lat) && isFinite(o.lon)) return { lat: o.lat, lon: o.lon };
      }
    } catch {}
    throw new Error('Location unavailable');
  }

  const load = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const loc = await getQuickCoords();
      const resp = await fetch(`${API_BASE_URL}/users/nearby?lat=${loc.lat}&lon=${loc.lon}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setUsers(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;
  if (error) return <Text style={styles.error}>{error}</Text>;

  return (
    <View style={styles.container}>
      {users.length === 0 ? (
        <Text style={styles.empty}>No nearby users found.</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => {
            const uri = toImageUrl(item.avatarUrl);
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => navigation.navigate('Chat', { user_id, peer_id: item.id, peerName: item.name })}
              >
                <Image source={uri ? { uri } : AVATAR_PLACEHOLDER} style={styles.avatar} />
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.lastSeen}>{item.lastSeen || ''}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  empty: { textAlign: 'center', marginTop: 20 },
  item: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  lastSeen: { color: '#666', marginTop: 4 }
});