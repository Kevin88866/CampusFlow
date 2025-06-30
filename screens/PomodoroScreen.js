import React, { useState, useEffect, useContext } from 'react';
import {View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { TimerContext } from '../TimerContext';

export default function PomodoroScreen({ route }) {
  const { user_id } = route.params;
  const { setPomodoroRunning } = useContext(TimerContext);
  const [workMin, setWorkMin] = useState('25');
  const [breakMin, setBreakMin] = useState('5');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [phase, setPhase] = useState('work');
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let timerId;
    if (running && secondsLeft > 0) {
      timerId = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    } else if (running && secondsLeft === 0) {
      if (phase === 'work') {
        Alert.alert('Work done!', 'Time for a break.');
        setPhase('break');
        setSecondsLeft(Number(breakMin) * 60);
      } else {
        Alert.alert('Break over!', 'Ready for next round?');
        setPhase('work');
        setSecondsLeft(Number(workMin) * 60);
      }
    }
    return () => clearInterval(timerId);
  }, [running, secondsLeft]);

  const start = () => {
    const w = Number(workMin);
    const b = Number(breakMin);
    if (isNaN(w) || w <= 0 || isNaN(b) || b <= 0) return Alert.alert('Invalid Input', 'Please enter positive numbers.');
    setPhase('work');
    setSecondsLeft(w * 60);
    setRunning(true);
    setPomodoroRunning(true);
  };
  const stopPomodoro = () => {
    setRunning(false);
    setPomodoroRunning(false);
  };
  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pomodoro Timer</Text>
      <View style={styles.inputs}>
        <Text style={styles.label}>Work (min):</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={workMin}
          onChangeText={setWorkMin}
        />
        <Text style={styles.label}>Break (min):</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={breakMin}
          onChangeText={setBreakMin}
        />
      </View>
      <Text style={styles.timer}>{mins}:{secs}</Text>
      <TouchableOpacity
        style={[styles.btn, running ? styles.stopBtn : styles.startBtn]}
        onPress={running ? stopPomodoro : start}
      >
        <Text style={styles.btnText}>{running ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  inputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  label: { fontSize: 16, marginHorizontal: 8 },
  input: { borderColor: '#CCC', width: 50, borderBottomWidth: 1, textAlign: 'center', marginHorizontal: 8 },
  timer: { fontSize: 48, textAlign: 'center', marginVertical: 20 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginHorizontal: 40 },
  startBtn: { backgroundColor: '#6C63FF' },
  stopBtn: { backgroundColor: '#d33' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
});