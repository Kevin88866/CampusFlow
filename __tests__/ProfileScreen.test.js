import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert, TouchableOpacity } from 'react-native'
import ProfileScreen from '../screens/ProfileScreen'

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
  CommonActions: { reset: jest.fn(() => ({ type: 'RESET' })) }
}))

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => () => null)

jest.mock('react-native-image-picker', () => {
  const result = { assets: [{ uri: 'file:///x.jpg', type: 'image/jpeg', fileName: 'x.jpg' }] }
  const launchImageLibrary = jest.fn((opts, cb) => cb ? cb(result) : Promise.resolve(result))
  const launchCamera = jest.fn((opts, cb) => cb ? cb({ didCancel: true }) : Promise.resolve({ didCancel: true }))
  return { launchImageLibrary, launchCamera }
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  global.FormData = function () { this.append = jest.fn() }
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id: 1, name: 'Alice', email: 'alice@example.com',
      phone: '', interest: '', coins: 0, avatarUrl: ''
    })
  })
})

const route = { params: { user_id: 1 } }

test('loads and displays user info', async () => {
  const { getByText } = render(<ProfileScreen route={route} />)
  await waitFor(() => getByText('Alice'))
  expect(getByText('alice@example.com')).toBeTruthy()
})

test('edit then save returns to view mode and shows updated name', async () => {
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1, name: 'Alice', email: 'alice@example.com',
        phone: '', interest: '', coins: 0, avatarUrl: ''
      })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1, name: 'Kevin', email: 'alice@example.com',
        phone: '', interest: '', coins: 0, avatarUrl: ''
      })
    })
  const { getByText } = render(<ProfileScreen route={route} />)
  await waitFor(() => getByText(/edit profile/i))
  fireEvent.press(getByText(/edit profile/i))
  await waitFor(() => getByText(/save/i))
  fireEvent.press(getByText(/save/i))
  await waitFor(() => getByText('Kevin'))
  expect(getByText(/edit profile/i)).toBeTruthy()
})

test('logout button dispatches reset', async () => {
  const navigation = { dispatch: jest.fn() }
  const { findByText, getByText } = render(<ProfileScreen route={route} navigation={navigation} />)
  await findByText(/logout/i)
  fireEvent.press(getByText(/logout/i))
  expect(navigation.dispatch).toHaveBeenCalled()
})

test('error view when load fails then retry succeeds', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'boom' }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1, name: 'A', email: 'a@e.st', phone: '', interest: '', avatarUrl: '', coins: 0
      })
    })
  const { findByText, getByText } = render(<ProfileScreen route={route} />)
  await findByText(/error:/i)
  fireEvent.press(getByText(/retry/i))
  await findByText(/edit profile/i)
})

test('edit avatar then save uses multipart branch', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1, name: 'A', email: 'a@e.st', phone: '', interest: '', avatarUrl: '', coins: 0
      })
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1, name: 'A', email: 'a@e.st', phone: '', interest: '', avatarUrl: 'new.png'
      })
    })
  const { findByText, getByText, UNSAFE_getAllByType } = render(<ProfileScreen route={route} />)
  await findByText(/edit profile/i)
  fireEvent.press(getByText(/edit profile/i))
  await waitFor(() => getByText(/save/i))
  const avatarBtn = UNSAFE_getAllByType(TouchableOpacity)[0]
  fireEvent.press(avatarBtn)
  fireEvent.press(getByText(/save/i))
  await findByText(/edit profile/i)
  expect(global.fetch).toHaveBeenCalledTimes(2)
})

test('shows error when profile save fails', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1, name: 'A', email: 'a@e.st', phone: '', interest: '',
        avatarUrl: null, coins: 0
      })
    })
    .mockRejectedValueOnce(new Error('save error'))
  const { getByText, findByText } = render(<ProfileScreen route={route} />)
  await findByText(/edit profile/i)
  fireEvent.press(getByText(/edit profile/i))
  await findByText(/save/i)
  fireEvent.press(getByText(/save/i))
  await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled())
})