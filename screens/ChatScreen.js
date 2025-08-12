import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { GiftedChat, Avatar, Bubble } from 'react-native-gifted-chat';
import io from 'socket.io-client';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE_URL, AVATAR_PLACEHOLDER, toImageUrl } from '../config';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user_id, peer_id, peerName } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [peerAvatar, setPeerAvatar] = useState('');

  useEffect(() => {
    let mounted = true;
    const s = io(API_BASE_URL, { query: { userId: user_id } });
    setSocket(s);

    fetch(`${API_BASE_URL}/users/${peer_id}`)
      .then(r => r.json())
      .then(u => { if (mounted) setPeerAvatar(toImageUrl(u.avatarUrl) || ''); })
      .catch(() => { if (mounted) setPeerAvatar(''); });

    fetch(`${API_BASE_URL}/messages/${peer_id}?user_id=${user_id}`)
      .then(res => res.json())
      .then(rows => {
        const msgs = rows.map(r => ({
          _id: r.id,
          text: r.content,
          createdAt: new Date(r.sent_at),
          user: { _id: r.sender_id, name: r.sender_id === user_id ? 'You' : peerName, avatar: r.sender_id === peer_id ? (peerAvatar || undefined) : undefined }
        }));
        setMessages(msgs.reverse());
      })
      .finally(() => setLoading(false));

    s.on('private_message', msg => {
      setMessages(prev =>
        GiftedChat.append(prev, [{
          _id: Date.now(),
          text: msg.content,
          createdAt: new Date(msg.sentAt),
          user: { _id: msg.fromUserId, name: peerName, avatar: peerAvatar || undefined }
        }])
      );
    });

    return () => { mounted = false; s.off('private_message'); s.disconnect(); };
  }, [peer_id, user_id, peerName]);

  useEffect(() => {
    if (!peerAvatar) return;
    setMessages(prev =>
      prev.map(m => m.user._id === peer_id ? { ...m, user: { ...m.user, avatar: peerAvatar || undefined } } : m)
    );
  }, [peerAvatar, peer_id]);

  const onSend = useCallback((msgs = []) => {
    if (socket && msgs.length > 0) {
      socket.emit('private_message', { toUserId: peer_id, content: msgs[0].text });
      setMessages(prev => GiftedChat.append(prev, msgs));
    }
  }, [socket, peer_id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <GiftedChat
      messages={messages}
      onSend={onSend}
      user={{ _id: user_id, name: 'You' }}
      placeholder={`Message ${peerName}`}
      renderAvatar={(props) => (
    <TouchableOpacity
      testID="peer-avatar"
      accessibilityRole="button"
      onPress={() =>
        navigation.navigate('UserProfile', {
          user_id,
          userId: props.currentMessage.user._id,
          name: props.currentMessage.user.name
        })
      }>
      {props.currentMessage.user.avatar
        ? <Avatar {...props} />
        : <Image source={AVATAR_PLACEHOLDER} style={{ width: 36, height: 36, borderRadius: 18, marginLeft: 8 }} />}
  </TouchableOpacity>
)}

      onPressAvatar={(user) => navigation.navigate('UserProfile', { user_id, userId: user._id, name: user.name })}
      renderUsernameOnMessage
      renderBubble={props => (
        <Bubble
          {...props}
          wrapperStyle={{ right: { backgroundColor: '#6C63FF' }, left: { backgroundColor: '#e0e0e0' } }}
          textStyle={{ right: { color: '#fff' } }}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});