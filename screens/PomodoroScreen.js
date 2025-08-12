import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform, PermissionsAndroid, AppState } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { TimerContext } from '../TimerContext';
import { getPositionSmart } from '../location';

function getDistance(lat1, lon1, lat2, lon2) {
  const toRad = v => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PomodoroScreen() {
  const { setPomodoroRunning } = useContext(TimerContext);

  const [workMin, setWorkMin] = useState('25');
  const [breakMin, setBreakMin] = useState('5');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [phase, setPhase] = useState('work');
  const [running, setRunning] = useState(false);
  const [areaCenter, setAreaCenter] = useState(null);

  const threshold = 50;
  const leaveHoldMs = 30000;

  const endTimeRef = useRef(null);
  const intervalRef = useRef(null);
  const watchIdRef = useRef(null);
  const graceUntilRef = useRef(0);
  const runningRef = useRef(false);
  const areaCenterRef = useRef(null);
  const outStartRef = useRef(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => { setPomodoroRunning(running); runningRef.current = running; }, [running]);
  useEffect(() => { areaCenterRef.current = areaCenter; }, [areaCenter]);

  useEffect(() => {
    const h = next => {
      if (appState.current.match(/inactive|background/) && next === 'active' && running && endTimeRef.current) {
        const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left <= 0) setRunning(false);
      }
      appState.current = next;
    };
    const sub = AppState.addEventListener('change', h);
    return () => sub.remove();
  }, [running]);

  useEffect(() => {
    clearInterval(intervalRef.current);
    if (running) {
      if (!endTimeRef.current) endTimeRef.current = Date.now() + secondsLeft * 1000;
      intervalRef.current = setInterval(() => {
        const left = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        setSecondsLeft(left);
        if (left <= 0) {
          clearInterval(intervalRef.current);
          if (phase === 'work') {
            setPhase('break');
            const total = Number(breakMin) * 60;
            endTimeRef.current = Date.now() + total * 1000;
            setSecondsLeft(total);
          } else {
            const studied = Number(workMin);
            const coins = Math.floor(studied / 30);
            Alert.alert('Well done', `You studied ${studied} minutes and earned ${coins} coin${coins !== 1 ? 's' : ''}.`);
            setRunning(false);
            endTimeRef.current = null;
          }
        }
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, breakMin, workMin, secondsLeft]);

  const ensurePermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      ]);
    } else {
      Geolocation.requestAuthorization('whenInUse');
    }
  };

  const getPositionFallback = () =>
    new Promise((resolve, reject) =>
      Geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 })
    );

  const clearWatch = () => {
    if (watchIdRef.current != null) {
      Geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const startWatch = () => {
    if (watchIdRef.current != null) return;
    const id = Geolocation.watchPosition(
      pos => {
        if (!runningRef.current || !areaCenterRef.current) return;
        if (Date.now() < graceUntilRef.current) return;
        const acc = typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : 9999;
        if (acc > 60) return;
        const { latitude: clat, longitude: clon } = areaCenterRef.current;
        const dist = getDistance(clat, clon, pos.coords.latitude, pos.coords.longitude);
        if (dist > threshold) {
          if (!outStartRef.current) outStartRef.current = Date.now();
          const held = Date.now() - (outStartRef.current || 0);
          if (held >= leaveHoldMs) {
            clearInterval(intervalRef.current);
            clearWatch();
            outStartRef.current = null;
            setRunning(false);
            endTimeRef.current = null;
            Alert.alert('Left study area', 'You have left the study area.');
          }
        } else {
          outStartRef.current = null;
        }
      },
      () => {},
      { enableHighAccuracy: true, distanceFilter: 10, timeout: 30000, maximumAge: 0 }
    );
    watchIdRef.current = id;
  };

  const stopPomodoro = () => {
    clearInterval(intervalRef.current);
    clearWatch();
    outStartRef.current = null;
    setRunning(false);
    const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const secs = String(secondsLeft % 60).padStart(2, '0');
    endTimeRef.current = null;
    Alert.alert('Stopped', `Timer stopped at ${mins}:${secs}, reward cancelled.`);
  };

  const start = async () => {
    const w = Number(workMin), b = Number(breakMin);
    if (!w || !b) return Alert.alert('Invalid Input', 'Enter positive numbers.');
    const total = w * 60;
    setPhase('work');
    endTimeRef.current = Date.now() + total * 1000;
    setSecondsLeft(total);
    setRunning(true);
    graceUntilRef.current = Date.now() + 8000;
    outStartRef.current = null;
    (async () => {
      try {
        await ensurePermission();
        let pos;
        try {
          pos = await getPositionSmart();
        } catch (e) {
          const msg = String(e && e.message || '').toLowerCase();
          const isTimeout = (e && e.code === 3) || msg.includes('timeout');
          if (!isTimeout) throw e;
          pos = await getPositionFallback();
        }
        setAreaCenter({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        startWatch();
      } catch {}
    })();
  };

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pomodoro Timer</Text>
      <View style={styles.inputs}>
        <Text style={styles.label}>Work:</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={workMin} onChangeText={setWorkMin} />
        <Text style={styles.label}>Break:</Text>
        <TextInput style={styles.input} keyboardType="number-pad" value={breakMin} onChangeText={setBreakMin} />
      </View>
      <Text style={styles.timer}>{mins}:{secs}</Text>
      <TouchableOpacity style={[styles.btn, running ? styles.stopBtn : styles.startBtn]} onPress={running ? stopPomodoro : start}>
        <Text style={styles.btnText}>{running ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' },
  inputs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  label: { fontSize: 16, marginHorizontal: 8 },
  input: { borderColor: '#CCC', width: 50, borderBottomWidth: 1, textAlign: 'center', marginHorizontal: 8 },
  timer: { fontSize: 48, textAlign: 'center', marginVertical: 20 },
  btn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 80, alignItems: 'center', marginHorizontal: 40 },
  startBtn: { backgroundColor: '#6C63FF' },
  stopBtn: { backgroundColor: '#d33' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' }
});