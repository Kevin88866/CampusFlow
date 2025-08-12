import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { GiftedChat, Avatar, Bubble } from 'react-native-gifted-chat';
import io from 'socket.io-client';
import { useRoute, useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../config'
const back = API_BASE_URL

export default function ChatScreen() {
  const route = useRoute();
  const navi = useNavigation();
  const { user_id, peer_id, peerName } = route.params;
  const [msg, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io(back, { query: { userId: user_id } });
    setSocket(newSocket);
    fetch(`${back}/messages/${peer_id}?user_id=${user_id}`)
      .then(res => res.json())
      .then(rows => {
        const msgs = rows.map(r => ({
          _id: r.id,
          text: r.content,
          createdAt: new Date(r.sent_at),
          user: { _id: r.sender_id, name: r.sender_id === user_id ? 'You' : peerName }
        }));
        setMessages(msgs.reverse());
      })
      .catch(error => console.log('Error loading messages:', error))
      .finally(() => setLoading(false));

    newSocket.on('private_message', msg => {
      setMessages(prev => GiftedChat.append(prev, [{
        _id: Date.now(),
        text: msg.content,
        createdAt: new Date(msg.sentAt),
        user: { _id: msg.fromUserId, name: peerName }
      }]));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [peer_id, user_id, peerName]);

  const onSend = useCallback((msgs = []) => {
    if (socket && msgs.length > 0) {
      const m = msgs[0];
      socket.emit('private_message', { toUserId: peer_id, content: m.text });
      setMessages(prev => GiftedChat.append(prev, msgs));
    }
  }, [socket, peer_id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={'#6C63FF'} />
        <Text>Loading messages...</Text>
      </View>
    );
  }

  return (
    <GiftedChat
      messages={msg}
      onSend={onSend}
      user={{ _id: user_id, name: 'You' }}
      placeholder={`Message ${peerName}`}
      renderAvatar={(props) => (
        <TouchableOpacity
          onPress={() => navi.navigate('UserProfile', {
            user_id,
            userId: props.currentMessage.user._id,
            name: props.currentMessage.user.name
          })}
        >
          <Avatar {...props} />
        </TouchableOpacity>
      )}
      onPressAvatar={(user) => navi.navigate('UserProfile', {
        user_id,
        userId: user._id,
        name: user.name
      })}
      renderUsernameOnMessage={true}
      renderBubble={(props) => (
        <Bubble {...props}
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