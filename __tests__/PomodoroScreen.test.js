jest.useFakeTimers();
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native')
  return {
    ...RN,
    Platform: { ...RN.Platform, OS: 'android', select: RN.Platform.select },
    Alert: { ...RN.Alert, alert: jest.fn() },
    PermissionsAndroid: {
      request: jest.fn(() => Promise.resolve('granted')),
      requestMultiple: jest.fn(() => Promise.resolve({})),
      check: jest.fn(() => Promise.resolve('granted')),
      RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
      PERMISSIONS: {
        ANDROID: {
          ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
          ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
        },
      },
    },
  }
})

jest.mock('@react-native-community/geolocation', () => ({
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn((success, error, options) => {
    success({ coords: { latitude: 1, longitude: 1, accuracy: 10 } })
  }),
  watchPosition: jest.fn((success, error, opts) => 1),
  clearWatch: jest.fn()
}));

jest.mock('../location', () => ({
  getPositionSmart: jest.fn().mockResolvedValue({ coords: { latitude: 1, longitude: 1, accuracy: 10 } })
}))

jest.mock('../TimerContext', () => {
  const React = require('react');
  return { TimerContext: React.createContext({ setPomodoroRunning: jest.fn() }) }
})

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import PomodoroScreen from '../screens/PomodoroScreen'
import { TimerContext } from '../TimerContext'

const wrapper = ({ children }) => (
  <TimerContext.Provider value={{ setPomodoroRunning: jest.fn() }}>
    {children}
  </TimerContext.Provider>
);

describe('PomodoroScreen', () => {
  test('start and stop keep time consistent', async () => {
    const { getByText } = render(<PomodoroScreen />, { wrapper })
    fireEvent.press(getByText('Start'))
    await waitFor(() => getByText('25:00'))
    act(() => { jest.advanceTimersByTime(1000) })
    await waitFor(() => getByText('24:59'))
    fireEvent.press(getByText('Stop'))
    act(() => { jest.advanceTimersByTime(0) })
    await waitFor(() => getByText('24:59'))
  });

  test('stop shows alert on manual stop', async () => {
    const RN = require('react-native')
    const { getByText } = render(<PomodoroScreen />, { wrapper })
    fireEvent.press(getByText('Start'))
    await waitFor(() => getByText(/\d{1,2}:\d{2}/))
    act(() => { jest.advanceTimersByTime(1000) })
    fireEvent.press(getByText('Stop'))
    expect(RN.Alert.alert).toHaveBeenCalled()
  })
})