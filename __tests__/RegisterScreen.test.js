jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

jest.mock('@react-navigation/native', () => ({
  useIsFocused: () => true,
}))

import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import RegisterScreen from '../screens/RegisterScreen'

describe('RegisterScreen', () => {
  let fetchMock
  let navigationMock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
    navigationMock = { replace: jest.fn(), navigate: jest.fn(), reset: jest.fn(), dispatch: jest.fn() }
  })

  it('does not call fetch when email is empty', () => {
    const { getByText } = render(<RegisterScreen navigation={navigationMock} />);
    fireEvent.press(getByText(/Send.*Code/i))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('sends code and moves to verify stage', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    const { getByPlaceholderText, getByText, queryByPlaceholderText } = render(
      <RegisterScreen navigation={navigationMock} />
    )
    fireEvent.changeText(getByPlaceholderText(/Email/i), 'a@b.com')
    fireEvent.press(getByText(/Send.*Code/i))
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/send-register-otp'),
        expect.objectContaining({ method: 'POST' })
      )
    })
    await waitFor(() => {
      expect(queryByPlaceholderText(/Email/i)).toBeNull()
    })
  })

  it('submits registration with all fields and navigates', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    const { getByPlaceholderText, getByText } = render(
      <RegisterScreen navigation={navigationMock} />
    )

    fireEvent.changeText(getByPlaceholderText(/Email/i), 'a@b.com')
    fireEvent.press(getByText(/Send.*Code/i))

    const codeInput = await waitFor(() => getByPlaceholderText(/^Code$/i));
    fireEvent.changeText(codeInput, '123456')
    fireEvent.changeText(getByPlaceholderText(/Username/i), 'Alice')
    fireEvent.changeText(getByPlaceholderText(/Phone/i), '12345678')
    fireEvent.changeText(getByPlaceholderText(/^Password$/i), 'pass123')
    fireEvent.changeText(getByPlaceholderText(/Confirm.*Password/i), 'pass123')
    fireEvent.changeText(getByPlaceholderText(/Interest/i), 'ball')

    fireEvent.press(getByText(/Register|Complete/i))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls[1][0]).toEqual(expect.stringContaining('/register'))
    })

    await waitFor(() => {
      const resetCalledWithLogin =
        navigationMock.reset.mock.calls.some(
          (c) =>
            c[0] &&
            c[0].routes &&
            Array.isArray(c[0].routes) &&
            c[0].routes.some((r) => r && r.name === 'Login')
        )
      const navOrReplaceCalled =
        navigationMock.replace.mock.calls.some((c) => c[0] === 'Login') ||
        navigationMock.navigate.mock.calls.some((c) => c[0] === 'Login')
      expect(resetCalledWithLogin || navOrReplaceCalled).toBe(true)
    })
  })
})