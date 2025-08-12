import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert } from 'react-native'

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon')
jest.mock('../location', () => ({ startLocationPrefetch: jest.fn() }))
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('@react-navigation/native', () => {
  const nav = { reset: jest.fn(), navigate: jest.fn(), replace: jest.fn() }
  return { useNavigation: () => nav, useIsFocused: () => true, __nav: nav }
})

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signOut: jest.fn().mockResolvedValue(),
    signIn: jest.fn().mockResolvedValue({ user: { email: 'a@b' } }),
    getTokens: jest.fn().mockResolvedValue({ idToken: 't' })
  },
  statusCodes: { PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE', SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED' }
}))

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(Alert, 'alert').mockImplementation(() => {})
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 7 }) })
})

const pressLoginButton = (utils) => {
  const nodes = utils.getAllByText(/^login$/i)
  fireEvent.press(nodes[nodes.length - 1])
}

test('login success resets navigation', async () => {
  const LoginScreen = require('../screens/LoginScreen').default
  const { getByPlaceholderText, getAllByText } = render(<LoginScreen />)
  fireEvent.changeText(getByPlaceholderText(/account/i), 'u')
  fireEvent.changeText(getByPlaceholderText(/password/i), 'p')
  fireEvent.press(getAllByText(/^login$/i).slice(-1)[0])
  const { __nav } = require('@react-navigation/native')
  await waitFor(() => expect(__nav.reset).toHaveBeenCalled())
})

test('login failure shows alert', async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Invalid' }) })
  const LoginScreen = require('../screens/LoginScreen').default
  const utils = render(<LoginScreen />)
  pressLoginButton(utils)
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled())
})

test('google login success resets navigation', async () => {
  const LoginScreen = require('../screens/LoginScreen').default
  const { getByText } = render(<LoginScreen />)
  fireEvent.press(getByText(/continue with google/i))
  const { __nav } = require('@react-navigation/native')
  await waitFor(() => expect(__nav.reset).toHaveBeenCalled())
})

test('handles Google sign-in cancelled gracefully', async () => {
  const { GoogleSignin } = require('@react-native-google-signin/google-signin')
  GoogleSignin.signIn.mockRejectedValueOnce({ code: 'SIGN_IN_CANCELLED', message: 'cancelled' })
  const LoginScreen = require('../screens/LoginScreen').default
  const { getByText } = render(<LoginScreen />)
  fireEvent.press(getByText(/continue with google/i))
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled())
  const { __nav } = require('@react-navigation/native')
  expect(__nav.reset).not.toHaveBeenCalled()
})

test('navigates to register and forgot password', () => {
  const LoginScreen = require('../screens/LoginScreen').default
  const { getByText } = render(<LoginScreen />)
  fireEvent.press(getByText(/sign up/i))
  fireEvent.press(getByText(/forgot password\?/i))
  const { __nav } = require('@react-navigation/native')
  expect(__nav.navigate).toHaveBeenCalled()
})