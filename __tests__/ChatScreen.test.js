import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { Alert, Text, View, TouchableOpacity } from 'react-native'
import ChatScreen from '../screens/ChatScreen'

jest.mock('../config', () => ({
  API_BASE_URL: 'http://test',
  AVATAR_PLACEHOLDER: '',
  toImageUrl: x => x,
}))

jest.mock('@react-navigation/native', () => {
  const nav = { navigate: jest.fn(), goBack: jest.fn() }
  return {
    useIsFocused: () => true,
    useRoute: () => ({ params: { user_id: 1, peer_id: 2, peerName: 'B' } }),
    useNavigation: () => nav,
    __nav: nav,
  }
})

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('react-native-gifted-chat', () => {
  const React = require('react')
  const { View, TouchableOpacity, Text } = require('react-native')
  const Impl = ({ messages = [], onSend, renderAvatar }) => (
    <View>
      {renderAvatar?.({ currentMessage: { user: { _id: 2, name: 'B', avatar: '' } } })}
      {messages.map((m, i) => (
        <Text key={m._id || m.id || i}>{m.text || m.content}</Text>
      ))}
      <TouchableOpacity testID="send-btn" onPress={() => onSend?.([])}>
        <Text>Send</Text>
      </TouchableOpacity>
    </View>
  )
  Impl.append = (prev = [], msgs = []) => [...msgs, ...prev]
  const Avatar = p => <View {...p} />
  const Bubble = p => <View {...p} />
  return { __esModule: true, default: Impl, GiftedChat: Impl, Avatar, Bubble }
})

jest.mock('socket.io-client', () => {
  const store = { current: null }
  const io = jest.fn(() => {
    const s = { emit: jest.fn(), on: jest.fn(), off: jest.fn(), disconnect: jest.fn() }
    store.current = s
    return s
  })
  io.__store = store
  return io
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  const io = require('socket.io-client')
  io.__store.current = null
})

test('shows loading indicator while fetching', () => {
  global.fetch = jest.fn(() => new Promise(() => {}))
  const { getByText } = render(<ChatScreen />)
  expect(getByText(/loading messages/i)).toBeTruthy()
})

test('loads and displays messages', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, avatarUrl: '' }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 10, content: 'hello', sent_at: new Date().toISOString(), sender_id: 2 }],
    })
  const { getByText } = render(<ChatScreen />)
  await waitFor(() => expect(getByText('hello')).toBeTruthy())
})

test('does not send when onSend gets empty payload', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ avatarUrl: '' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  const { findByTestId } = render(<ChatScreen />)
  const btn = await findByTestId('send-btn')
  fireEvent.press(btn)
  expect(global.fetch).toHaveBeenCalledTimes(2)
})

test('keeps message and does not crash when send is pressed', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, username: 'B' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  const { findByTestId } = render(<ChatScreen />)
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  const btn = await findByTestId('send-btn')
  fireEvent.press(btn)
  await waitFor(() => expect(Alert.alert).not.toHaveBeenCalled())
})

test('send success emits socket', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, avatarUrl: '' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 99 }) })
  const utils = render(<ChatScreen />)
  const Gifted = await waitFor(() => utils.UNSAFE_getByType(require('react-native-gifted-chat').GiftedChat))
  await act(async () => {
    Gifted.props.onSend([{ _id: 'm1', text: 'hi', createdAt: new Date(), user: { _id: 1 } }])
  })
  const io = require('socket.io-client')
  expect(io.__store.current.emit).toHaveBeenCalled()
})

test('subscribes to socket private_message', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, avatarUrl: '' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  render(<ChatScreen />)
  const io = require('socket.io-client')
  await waitFor(() => expect(io.__store.current).not.toBeNull())
  await waitFor(() =>
    expect(io.__store.current.on).toHaveBeenCalledWith('private_message', expect.any(Function))
  )
})

test('cleans up socket listeners on unmount', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, avatarUrl: '' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  const { unmount } = render(<ChatScreen />)
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  const io = require('socket.io-client')
  const sock = io.__store.current
  unmount()
  expect(sock.off).toHaveBeenCalled()
  expect(sock.disconnect).toHaveBeenCalled()
})

test('pressing avatar navigates', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, avatarUrl: 'x.png' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
  const { getByTestId } = render(<ChatScreen />)
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  fireEvent.press(getByTestId('peer-avatar'))
  const { __nav } = require('@react-navigation/native')
  await waitFor(() => expect(__nav.navigate).toHaveBeenCalled())
})

test('loads history without parsing errors', async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 2, avatarUrl: 'x.png' }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, content: 'hi', sent_at: '2024-01-01T00:00:00Z', sender_id: 2 },
        { id: 2, content: 'yo', sent_at: '2024-01-01T00:00:01Z', sender_id: 1 },
      ],
    })
  render(<ChatScreen />)
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  await act(async () => {})
})