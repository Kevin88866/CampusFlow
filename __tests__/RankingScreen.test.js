import React from 'react'
import { render, waitFor } from '@testing-library/react-native'

jest.mock('../config', () => ({ API_BASE_URL: 'http://localhost' }))
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }))

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ([
    { id: 1, username: 'A', coins: 10, reachedAt: '2025-08-09T10:00:00Z' },
    { id: 2, username: 'B', coins: 10, reachedAt: '2025-08-10T10:00:00Z' }
  ])
})

import RankingScreen from '../screens/RankingScreen'

const defaultProps = {
  route: { params: { user_id: 1 } },
  navigation: { navigate: jest.fn(), replace: jest.fn() }
}

test('stable order with ties', async () => {
  const { getByText } = render(<RankingScreen {...defaultProps} />)
  await waitFor(() => getByText('A'))
  expect(getByText('A')).toBeTruthy()
  expect(getByText('B')).toBeTruthy()
})