import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import ChatScreen from '../screens/ChatScreen';
const mockSocket = { on: jest.fn(), emit: jest.fn(), disconnect: jest.fn() };
jest.mock('socket.io-client', () => () => mockSocket);
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useRoute: () => ({ params: { user_id: 1, peer_id: 2, peerName: 'Alice' } }),
    useNavigation: () => ({ navigate: jest.fn() }),
    useFocusEffect: callback => React.useEffect(callback, []),
  };
});
jest.mock('react-native-gifted-chat', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  function GiftedChat({ messages, onSend }) {
    return React.createElement(
      View,
      null,
      messages.map(m => React.createElement(Text, { key: m._id }, m.text))
    );
  }
  GiftedChat.append = (prev, msgs) => [...msgs, ...prev];
  return { GiftedChat };
});

describe('ChatScreen', () => {
  beforeEach(() => {
    mockSocket.emit.mockClear();
    global.fetch = jest.fn();
  });

  it('loads and displays messages', async () => {
    const messagesFromServer = [
      { id: 10, content: 'hello', sent_at: new Date().toISOString(), sender_id: 2 }
    ];
    fetch.mockResolvedValueOnce({ json: () => Promise.resolve(messagesFromServer) });

    const { getByText } = render(<ChatScreen />);
    await waitFor(() => {
      expect(getByText('hello')).toBeTruthy();
    });
  });

  it('sends a message', async () => {
    fetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });

    const utils = render(<ChatScreen />);
    const gift = await waitFor(() => utils.UNSAFE_getByType(require('react-native-gifted-chat').GiftedChat));

    await act(async () => {
      gift.props.onSend([
        { _id: '1', text: 'yo', createdAt: new Date(), user: { _id: 1 } }
      ]);
    });

    expect(mockSocket.emit).toHaveBeenCalledWith(
      'private_message',
      expect.objectContaining({ content: 'yo' })
    );
  });
});
