import React from 'react'
import { render, act, waitFor, fireEvent } from '@testing-library/react-native'

jest.mock('../config', () => ({
  API_BASE_URL: 'http://test',
  AVATAR_PLACEHOLDER: { uri: 'x' },
  toImageUrl: v => v
}))

jest.mock('@react-navigation/native', () => {
  let params = { userId: 1 }
  const nav = { navigate: jest.fn(), goBack: jest.fn() }
  return {
    useRoute: () => ({ params }),
    useNavigation: () => nav,
    __setRouteParams: p => { params = p },
    __nav: nav
  }
})

let UserProfileScreen

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 1, name: 'Alice', email: 'a@b', phone: '1', coins: 3, avatarUrl: '' })
  })
  UserProfileScreen = require('../screens/UserProfileScreen').default
})

test('loads user profile and calls fetch', async () => {
  const { getByText } = render(<UserProfileScreen />)
  await waitFor(() => getByText(/alice/i))
  expect(global.fetch).toHaveBeenCalled()
})

test('does not fetch when no user id', async () => {
  const nav = require('@react-navigation/native')
  nav.__setRouteParams({})
  render(<UserProfileScreen />)
  await act(async () => {})
  expect(global.fetch).not.toHaveBeenCalled()
})

test('back buttons navigate', async () => {
  const nav = require('@react-navigation/native')
  nav.__setRouteParams({ userId: 1 })
  const ok = render(<UserProfileScreen />)
  await waitFor(() => ok.getByText(/alice/i))
  fireEvent.press(ok.getByText(/back/i))
  expect(nav.__nav.goBack).toHaveBeenCalled()
  nav.__setRouteParams({})
  const err = render(<UserProfileScreen />)
  await act(async () => {})
  fireEvent.press(err.getByText(/go back/i))
  expect(nav.__nav.goBack).toHaveBeenCalled()
})