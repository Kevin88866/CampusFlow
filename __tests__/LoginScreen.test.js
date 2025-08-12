import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';

global.fetch = jest.fn();

describe('LoginScreen', () => {
  it('Do not initiate a network request when there is no input', () => {
    const { getByText } = render(<LoginScreen />);
    fireEvent.press(getByText('Login'));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('Initiate login after correct input', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1 })
    });
    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    fireEvent.changeText(getByPlaceholderText('Account'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'pass123');
    fireEvent.press(getByText('Login'));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  });
});
