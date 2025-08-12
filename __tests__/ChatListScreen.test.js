import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ChatListScreen from '../screens/ChatListScreen';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => {
  const { useEffect } = require('react')
  return {
    useFocusEffect: callback => useEffect(callback, []),
    useNavigation: () => ({ navigate: mockNavigate, setOptions: jest.fn() }),
    useRoute: () => ({ params: { user_id: 1 } }),
  }
})

describe('ChatListScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('shows empty state when no conversations', async () => {
    fetch.mockResolvedValueOnce({ json: () => Promise.resolve([]) });
    const { getByText } = render(<ChatListScreen />);
    await waitFor(() => expect(getByText('No conversations yet')).toBeTruthy());
  });

  it('renders conversations and navigates', async () => {
    const conv = [{ peer_id: 2, peerName: 'Alice', lastSent: Date.now() }];
    fetch.mockResolvedValueOnce({ json: () => Promise.resolve(conv) });
    const navigation = useNavigation();
    const { getByText } = render(<ChatListScreen />);
    await waitFor(() => expect(getByText('Alice')).toBeTruthy());
    fireEvent.press(getByText('Alice'));
    expect(navigation.navigate).toHaveBeenCalledWith('Chat', expect.objectContaining({ peer_id: 2 }));
  });
});
