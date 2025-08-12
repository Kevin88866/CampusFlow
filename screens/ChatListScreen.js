import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { API_BASE_URL, AVATAR_PLACEHOLDER, toImageUrl } from '../config';
const back = API_BASE_URL;

export default function ChatListScreen() {
  const navi = useNavigation();
  const { user_id } = useRoute().params;
  const [conver, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      let alive = true;
      setLoading(true);
      (async () => {
        try {
          const res = await fetch(`${back}/conversations/${user_id}`);
          const list = await res.json();
          const enriched = await Promise.all(
            list.map(async (c) => {
              try {
                const ures = await fetch(`${back}/users/${c.peer_id}`);
                const u = await ures.json();
                return { ...c, avatarUri: toImageUrl(u.avatarUrl) || '' };
              } catch {
                return { ...c, avatarUri: '' };
              }
            })
          );
          if (alive) setConversations(enriched);
        } catch (e) {
          if (alive) setConversations([]);
          console.error(e);
        } finally {
          if (alive) setLoading(false);
        }
      })();
      return () => {
        alive = false;
      };
    }, [user_id])
  );

  React.useLayoutEffect(() => {
    navi.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.findBtn}
          onPress={() => navi.navigate('NearbyUsers', { user_id })}
        >
          <Text style={styles.findText}>Find Buddies</Text>
        </TouchableOpacity>
      )
    });
  }, [navi, user_id]);

  if (loading) {
    return <ActivityIndicator style={styles.centered} size="large" />;
  }
  if (conver.length === 0) {
    return <Text style={styles.empty}>No conversations yet</Text>;
  }

  return (
    <FlatList
      data={conver}
      keyExtractor={(item) => item.peer_id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() =>
            navi.navigate('Chat', {
              user_id,
              peer_id: item.peer_id,
              peerName: item.peerName
            })
          }
        >
          <Image
            source={item.avatarUri ? { uri: item.avatarUri } : AVATAR_PLACEHOLDER}
            style={styles.avatar}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{item.peerName}</Text>
            <Text style={styles.time}>{new Date(item.lastSent).toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, textAlign: 'center', marginTop: 20 },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#ccc', flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600' },
  time: { fontSize: 12, color: '#666', marginTop: 4 },
  findBtn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10 },
  findText: { color: '#FFF', fontSize: 14, fontWeight: '500' }
});