jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn((success) =>
    success({ coords: { latitude: 1, longitude: 2 } })
  ),
}));

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NearbyUsersScreen from '../screens/NearbyUsersScreen';

describe('NearbyUsersScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('shows empty when no users', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([]) });
    const navigation = { navigate: jest.fn() };
    const route = { params: { user_id: 1 } };
    const { getByText } = render(
      <NearbyUsersScreen navigation={navigation} route={route} />
    );
    await waitFor(() => getByText('No nearby users found.'));
  });

  it('renders users and navigates', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 2, name: 'Alice', avatarUrl: '', lastSeen: '' }]),
    });
    const navigation = { navigate: jest.fn() };
    const route = { params: { user_id: 1 } };
    const { getByText } = render(
      <NearbyUsersScreen navigation={navigation} route={route} />
    );
    await waitFor(() => getByText('Alice'));
    fireEvent.press(getByText('Alice'));
    expect(navigation.navigate).toHaveBeenCalledWith('Chat', {
      user_id: 1,
      peer_id: 2,
      peerName: 'Alice',
    });
  });
});
