import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../config'
const back = API_BASE_URL

export default function ChatListScreen() {
  const navi = useNavigation();
  const route = useRoute();
  const { user_id } = route.params;
  const [conver, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true);
      fetch(`${back}/conversations/${user_id}`)
        .then(res => res.json())
        .then(data => setConversations(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, [user_id])
  );

  React.useLayoutEffect(() => {
    navi.setOptions({
      headerRight: () => (
        <TouchableOpacity style={styles.findBtn} onPress={() => navi.navigate('NearbyUsers', { user_id })}>
          <Text style={styles.findText}>Find Buddies</Text>
        </TouchableOpacity>
      ),
    });
  }, [navi, user_id]);

  if (loading) return <ActivityIndicator style={styles.centered} size="large" />;
  if (conver.length === 0) return <Text style={styles.empty}>No conversations yet</Text>;

  return (
    <FlatList
      data={conver}
      keyExtractor={item => item.peer_id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.item}
          onPress={() =>
            navi.navigate('Chat', {
              user_id,
              peer_id: item.peer_id,
              peerName: item.peerName,
            })
          }
        >
          <Text style={styles.name}>{item.peerName}</Text>
          <Text style={styles.time}>
            {new Date(item.lastSent).toLocaleString()}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, textAlign: 'center', marginTop: 20 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#ccc' },
  name: { fontSize: 16, fontWeight: '600' },
  time: { fontSize: 12, color: '#666', marginTop: 4 },
  findBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10 },
  findText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
});
