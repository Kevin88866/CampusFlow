import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import SurveyScreen from '../screens/SurveyScreen';
jest.mock('@react-native-community/geolocation', () => ({
  getCurrentPosition: jest.fn()
}));
global.fetch = jest.fn();

describe('SurveyScreen', () => {
  beforeEach(() => {
    fetch.mockReset();
    Geolocation.getCurrentPosition.mockReset();
  });

  it('renders and submits survey', async () => {
    Geolocation.getCurrentPosition.mockImplementation(success =>
      success({ coords: { latitude: 10, longitude: 20 } })
    );
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ newCoins: 3 })
    });

    const { getByText } = render(
      <SurveyScreen
        route={{ params: { user_id: 1, username: 'Alice' } }}
        navigation={{ replace: jest.fn() }}
      />
    );

    await waitFor(() => expect(getByText('10.0000, 20.0000')).toBeTruthy());
    fireEvent.press(getByText('Submit Survey (+1 coin)'));
    await waitFor(() =>
      expect(getByText('Submitted! Coins: 3')).toBeTruthy()
    );
  });

  it('does not submit if location fails', () => {
    Geolocation.getCurrentPosition.mockImplementation((_, error) =>
      error({ message: 'no loc' })
    );
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByText } = render(
      <SurveyScreen
        route={{ params: { user_id: 1, username: 'Alice' } }}
        navigation={{ replace: jest.fn() }}
      />
    );

    fireEvent.press(getByText('Submit Survey (+1 coin)'));
    expect(alertSpy).toHaveBeenCalledWith('Location not ready');
  });
});
