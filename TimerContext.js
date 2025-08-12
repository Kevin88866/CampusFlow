import React, { createContext, useState } from 'react';

export const TimerContext = createContext({
  isPomodoroRunning: false,
  setPomodoroRunning: () => {},
});

export function TimerProvider({ children }) {
  const [isPomodoroRunning, setPomodoroRunning] = useState(false);

  return (
    <TimerContext.Provider value={{ isPomodoroRunning, setPomodoroRunning }}>
      {children}
    </TimerContext.Provider>
  );
}