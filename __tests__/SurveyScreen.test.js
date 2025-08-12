const REAL_WARN = console.warn
console.warn = (msg, ...rest) => {
  const s = typeof msg === 'string' ? msg : String(msg || '')
  if (
    s.includes('ProgressBarAndroid has been extracted') ||
    s.includes('Clipboard has been extracted') ||
    s.includes('PushNotificationIOS has been extracted') ||
    (s.includes('NativeEventEmitter') && (s.includes('addListener') || s.includes('removeListeners')))
  ) {
    return
  }
  return REAL_WARN(msg, ...rest)
}

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return class MockNativeEventEmitter {
    addListener() { return { remove() {} } }
    removeListener() {}
    removeAllListeners() {}
    removeListeners() {}
    emit() {}
    once() {}
  }
})

const React = require('react')
const { render, fireEvent, waitFor } = require('@testing-library/react-native')

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
        ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
        ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
      },
    },
    NativeModules: {
      ...RN.NativeModules,
      DevSettings: { addListener: jest.fn(), removeListeners: jest.fn() },
    },
  }
})

jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }))

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn(() => 1),
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  requestAuthorization: jest.fn(),
  setRNConfiguration: jest.fn(),
}))

jest.mock('@react-native-picker/picker', () => {
  const React = require('react')
  const { View, Text } = require('react-native')
  const Picker = ({ children }) => <View>{children}</View>
  Picker.Item = ({ label }) => <Text>{label}</Text>
  return { Picker }
})

jest.mock('../location', () => ({
  getPositionSmart: jest.fn().mockResolvedValue({
    coords: { latitude: 10, longitude: 20, accuracy: 10 },
    timestamp: Date.now(),
  }),
  startLocationPrefetch: jest.fn(),
  stopLocationPrefetch: jest.fn(),
}))

const route = { params: { user_id: 1, username: 'Alice' } }
let SurveyScreen

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, newCoins: 1 }),
  })
  SurveyScreen = require('../screens/SurveyScreen').default
})

afterAll(() => {
  console.warn = REAL_WARN
})

test('shows coordinates and submit success message', async () => {
  const { getByText, findByText } = render(<SurveyScreen route={route} />)
  await waitFor(() => getByText('Lat: 10.000000, Lon: 20.000000'))
  fireEvent.press(getByText(/submit survey/i))
  expect(await findByText(/submitted successfully|success|coin/i)).toBeTruthy()
})

test('second submission within cooldown returns 429 and alerts', async () => {
  const { Alert } = require('react-native')
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
    .mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({ error: 'cooldown' }) })
  const { getByText } = render(<SurveyScreen route={route} />)
  await waitFor(() => getByText('Lat: 10.000000, Lon: 20.000000'))
  fireEvent.press(getByText(/submit survey/i))
  await waitFor(() => getByText(/submitted successfully|success|coin/i))
  fireEvent.press(getByText(/submit survey/i))
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled())
  const last = Alert.alert.mock.calls.at(-1)
  expect(last[0]).toMatch(/submit error/i)
  expect(last[1]).toMatch(/cooldown/i)
})

test('blocks submit when no GPS fix', async () => {
  const { Alert } = require('react-native')
  const loc = require('../location')
  loc.getPositionSmart.mockResolvedValueOnce(null)
  const { getByText, findByText } = render(<SurveyScreen route={route} />)
  await findByText(/location unavailable/i)
  const calls = global.fetch.mock.calls.length
  fireEvent.press(getByText(/submit survey/i))
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled())
  expect(global.fetch.mock.calls.length).toBe(calls)
})

test('shows alert on server 500', async () => {
  const { Alert } = require('react-native')
  const loc = require('../location')
  loc.getPositionSmart.mockResolvedValueOnce({ coords: { latitude: 1, longitude: 2 } })
  global.fetch = jest.fn().mockResolvedValueOnce({
    ok: false,
    status: 500,
    json: async () => ({ error: 'server' }),
  })
  const { getByText } = render(<SurveyScreen route={route} />)
  await waitFor(() => getByText(/submit survey/i))
  fireEvent.press(getByText(/submit survey/i))
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled())
})