import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import ProfileScreen from '../screens/ProfileScreen'

global.fetch = jest.fn()

describe('ProfileScreen', () => {
  const route = { params: { user_id: 1 } }
  const navigation = { navigate: jest.fn() }

  beforeEach(() => {
    fetch.mockClear()
  })

  it('loads and displays user info', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        name: 'Alice',
        email: 'alice@example.com',
        phone: '',
        interest: '',
        coins: 0
      })
    })

    const { getByText } = render(
      <ProfileScreen route={route} navigation={navigation} />
    )

    await waitFor(() => expect(getByText('Alice')).toBeTruthy())
    expect(getByText('alice@example.com')).toBeTruthy()
  })

  it('edits and saves profile', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          name: 'Alice',
          email: 'alice@example.com',
          phone: '',
          interest: '',
          coins: 0
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          name: 'Kevin',
          email: 'alice@example.com',
          phone: '',
          interest: '',
          coins: 0
        })
      })

    const { getByText, getByDisplayValue } = render(
      <ProfileScreen route={route} navigation={navigation} />
    )

    await waitFor(() => expect(getByText('Alice')).toBeTruthy())

    fireEvent.press(getByText('Edit Profile'))
    const nameInput = getByDisplayValue('Alice')
    fireEvent.changeText(nameInput, 'Kevin')
    fireEvent.press(getByText('Save'))

    await waitFor(() => expect(getByText('Kevin')).toBeTruthy())
  })
})
