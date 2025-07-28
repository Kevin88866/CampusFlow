import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('resets password and navigates', async () => {
    fetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    const navigation = { replace: jest.fn() };
    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={navigation} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.press(getByText('Send Verification Code'));
    await waitFor(() => getByPlaceholderText('Verification Code'));

    fireEvent.changeText(getByPlaceholderText('Verification Code'), '0000');
    fireEvent.changeText(getByPlaceholderText('New Password'), 'newpass');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'newpass');
    fireEvent.press(getByText('Reset Password'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reset-password'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(navigation.replace).toHaveBeenCalledWith('Login');
    });
  });
});
