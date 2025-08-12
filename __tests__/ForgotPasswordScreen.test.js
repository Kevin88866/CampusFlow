import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  })

  it('resets password and navigates', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    const navigation = { reset: jest.fn(), replace: jest.fn(), navigate: jest.fn() };
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={navigation} />
    )

    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.press(getByText('Send Code'));

    await waitFor(() => getByPlaceholderText('Code'));

    fireEvent.changeText(getByPlaceholderText('Code'), '123456');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass1');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'newpass1');
    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('/reset-password'),
        expect.objectContaining({ method: 'POST' })
      )
      expect(navigation.reset).toHaveBeenCalledWith(
        expect.objectContaining({ routes: [ { name: 'Login' } ] })
      )
    })
  })
})