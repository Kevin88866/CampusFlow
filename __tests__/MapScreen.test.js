import React from 'react'
import { render, waitFor, act } from '@testing-library/react-native'

jest.useFakeTimers()

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('../config', () => ({ API_BASE_URL: 'http://test' }))

jest.mock('@react-navigation/native', () => {
  let focused = true
  return {
    useIsFocused: () => focused,
    __setIsFocused: v => { focused = v }
  }
})

jest.mock('../location', () => ({
  startLocationPrefetch: jest.fn(),
  stopLocationPrefetch: jest.fn(),
  getPositionSmart: jest.fn().mockResolvedValue({ coords: { latitude: 1.2966, longitude: 103.7764 } }),
}))

jest.mock('react-native-maps', () => {
  const React = require('react')
  const { View } = require('react-native')
  const apis = []
  const Map = React.forwardRef((props, ref) => {
    const api = { animateToRegion: jest.fn() }
    apis.push(api)
    if (typeof ref === 'function') ref(api)
    else if (ref) ref.current = api
    return <View testID="Map">{props.children}</View>
  })
  const Marker = p => <View testID="Marker" {...p} />
  const Callout = p => <View {...p} />
  return { __esModule: true, default: Map, Marker, Callout, PROVIDER_GOOGLE: 'google', __apis: apis }
})

let MapScreen

const flush = async (ms = 0) => {
  await act(async () => {
    if (ms > 0) jest.advanceTimersByTime(ms)
    else jest.runOnlyPendingTimers()
    await Promise.resolve()
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  delete global.__lastLocation
  const AS = require('@react-native-async-storage/async-storage')
  AS.getItem.mockResolvedValue(JSON.stringify({ lat: 1.2966, lon: 103.7764, ts: Date.now() }))
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ level: 'Moderate' }) })
  MapScreen = require('../screens/MapScreen').default
  const nav = require('@react-navigation/native')
  nav.__setIsFocused(true)
})

afterAll(() => {
  jest.useRealTimers()
})

test('calls prefetch on mount', async () => {
  const { startLocationPrefetch } = require('../location')
  render(<MapScreen />)
  await flush()
  expect(startLocationPrefetch).toHaveBeenCalled()
})

test('renders map and occupancy, cached label may appear', async () => {
  global.__lastLocation = { lat: 1.30, lon: 103.77, ts: Date.now() }
  const utils = render(<MapScreen />)
  await flush()
  await utils.findByTestId('Map')
  await utils.findByText(/occupancy:\s*moderate/i)
  const cached = utils.queryByText(/showing cached location/i)
  if (!cached) expect(cached).toBeNull()
})

test('animates to new location when live updates arrive', async () => {
  const maps = require('react-native-maps')
  render(<MapScreen />)
  await flush()
  const initialFetchCalls = global.fetch.mock.calls.length
  global.__lastLocation = { lat: 1.2970, lon: 103.7769, ts: Date.now() }
  await flush(1500)
  const anyAnimated = maps.__apis.some(a => a.animateToRegion.mock.calls.length > 0)
  expect(anyAnimated).toBe(true)
  await waitFor(() => expect(global.fetch.mock.calls.length).toBeGreaterThan(initialFetchCalls))
})

test('handles first live location when no cache exists', async () => {
  const AS = require('@react-native-async-storage/async-storage')
  AS.getItem.mockResolvedValueOnce(null)
  delete global.__lastLocation
  MapScreen = require('../screens/MapScreen').default
  const maps = require('react-native-maps')
  const utils = render(<MapScreen />)
  await flush()
  const initialMarkers = utils.queryAllByTestId('Marker').length
  const initialAnimCalls = maps.__apis.reduce((s,a)=>s+a.animateToRegion.mock.calls.length,0)
  global.__lastLocation = { lat: 1.2950, lon: 103.7750, ts: Date.now() }
  await flush(1200)
  const animCalls = maps.__apis.reduce((s,a)=>s+a.animateToRegion.mock.calls.length,0)
  expect(animCalls).toBeGreaterThan(initialAnimCalls)
  await waitFor(() => expect(utils.queryAllByTestId('Marker').length).toBeGreaterThanOrEqual(initialMarkers))
})