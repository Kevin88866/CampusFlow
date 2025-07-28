import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';

describe('RegisterScreen', () => {
  let fetchMock;
  let navigationMock;
  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    navigationMock = { replace: jest.fn() };
  });

  it('does not call fetch when email is empty', () => {
    const { getByText } = render(<RegisterScreen navigation={navigationMock} />);
    fireEvent.press(getByText('Send Verification Code'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends code and moves to verify stage', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });
    const { getByPlaceholderText, getByText, queryByPlaceholderText } = render(
      <RegisterScreen navigation={navigationMock} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.press(getByText('Send Verification Code'));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/send-register-otp'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(queryByPlaceholderText('Email')).toBeNull();
    });
  });

  it('submits registration with all fields and navigates', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    const { getByPlaceholderText, getByText } = render(
      <RegisterScreen navigation={navigationMock} />
    );
    fireEvent.changeText(getByPlaceholderText('Email'), 'a@b.com');
    fireEvent.press(getByText('Send Verification Code'));
    await waitFor(() => getByPlaceholderText('Verification Code'));
    fireEvent.changeText(getByPlaceholderText('Verification Code'), '1234');
    fireEvent.changeText(getByPlaceholderText('Username'), 'Alice');
    fireEvent.changeText(getByPlaceholderText('Phone'), '12345678');
    fireEvent.changeText(getByPlaceholderText('Interests (e.g. basketball)'), 'ball');
    fireEvent.changeText(getByPlaceholderText('Password'), 'pass');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'pass');
    fireEvent.press(getByText('Complete Registration'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(navigationMock.replace).toHaveBeenCalledWith('Login');
    });
  });
});
