import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { TimerContext } from '../TimerContext';

function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PomodoroScreen({ route }) {
  const { user_id } = route.params;
  const { setPomodoroRunning } = useContext(TimerContext);
  const [workMin, setWorkMin] = useState('25');
  const [breakMin, setBreakMin] = useState('5');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [phase, setPhase] = useState('work');
  const [running, setRunning] = useState(false);
  const [areaCenter, setAreaCenter] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const threshold = 50;

  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }
  }, []);

  useEffect(() => {
    let timerId;
    if (running && secondsLeft > 0) {
      timerId = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    } else if (running && secondsLeft === 0) {
      Alert.alert(
        phase === 'work' ? 'Work done!' : 'Break over!',
        phase === 'work' ? 'Time for a break.' : 'Ready for next round?'
      );
      if (phase === 'work') {
        setPhase('break');
        setSecondsLeft(Number(breakMin) * 60);
      } else {
        setPhase('work');
        setSecondsLeft(Number(workMin) * 60);
      }
    }
    return () => clearInterval(timerId);
  }, [running, secondsLeft]);

  const startWatch = center => {
    const id = Geolocation.watchPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        const dist = getDistance(center.latitude, center.longitude, latitude, longitude);
        if (dist > threshold) {
          Alert.alert('Moved Away', 'You have left the study area. Pomodoro stopped.');
          stopPomodoro();
        }
      },
      err => console.warn('Watch error', err),
      { enableHighAccuracy: true, distanceFilter: 5 }
    );
    setWatchId(id);
  };

  const clearWatch = () => {
    if (watchId != null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  const start = () => {
    const w = Number(workMin);
    const b = Number(breakMin);
    if (isNaN(w) || w <= 0 || isNaN(b) || b <= 0) {
      return Alert.alert('Invalid Input', 'Please enter positive numbers.');
    }
    Geolocation.getCurrentPosition(
      pos => {
        const center = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setAreaCenter(center);
        startWatch(center);
      },
      err => Alert.alert('Location Error', err.message),
      { enableHighAccuracy: true }
    );
    setPhase('work');
    setSecondsLeft(w * 60);
    setRunning(true);
    setPomodoroRunning(true);
  };

  const stopPomodoro = () => {
    setRunning(false);
    setPomodoroRunning(false);
    clearWatch();
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
      <Text testID="timer" style={styles.timer}>{mins}:{secs}</Text>
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
