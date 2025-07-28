import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import PomodoroScreen from '../screens/PomodoroScreen'
import { TimerContext } from '../TimerContext'
jest.useFakeTimers()
jest.mock('../TimerContext', () => {
  const React = require('react')
  return {
    TimerContext: React.createContext({ setPomodoroRunning: jest.fn() })
  }
})

const wrapper = ({ children }) => (
  <TimerContext.Provider value={{ setPomodoroRunning: jest.fn() }}>
    {children}
  </TimerContext.Provider>
)

describe('PomodoroScreen', () => {
  it('starts, ticks and stops the timer', async () => {
    const { getByText, getByTestId } = render(
      <PomodoroScreen route={{ params: { user_id: 1 } }} />,
      { wrapper }
    )

    fireEvent.press(getByText('Start'))

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    await waitFor(() =>
      expect(getByTestId('timer')).toHaveTextContent('24:59')
    )

    fireEvent.press(getByText('Stop'))

    act(() => {
      jest.advanceTimersByTime(0)
    })

    await waitFor(() =>
      expect(getByTestId('timer')).toHaveTextContent('24:59')
    )
  })
})
