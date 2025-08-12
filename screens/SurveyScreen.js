import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from '@react-native-community/geolocation';
import { API_BASE_URL } from '../config'
const back = API_BASE_URL

const OPTIONS = [
  { label: 'Very Crowded (>75%)', value: 'Very Crowded (>75%)' },
  { label: 'Crowded (>50%)', value: 'Crowded (>50%)' },
  { label: 'Moderate (>25%)', value: 'Moderate (>25%)' },
  { label: 'Sparse (>0%)', value: 'Sparse (>0%)' },
];

export default function SurveyScreen({ route, navigation }) {
  const { user_id, username } = route.params;
  const [loc, setLoc] = useState(null);
  const [level, setLevel] = useState(OPTIONS[0].value);
  const [msg, setMsg] = useState('');
  const reqPerm = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        { title: 'CampusFlow', message: 'Allow location?' }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  useEffect(() => {
    (async () => {
      if (!(await reqPerm())) return Alert.alert('Permission Denied');
      Geolocation.getCurrentPosition(
        pos => setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => Alert.alert('Error', err.message),
        { enableHighAccuracy: true }
      );
    })();
  }, []);

  const submit = async () => {
    if (!loc) return Alert.alert('Location not ready');
    try {
      const res = await fetch(`${back}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          occupancy_level: level,
        }),
      });
      const data = await res.json();
      if (res.ok) setMsg(`Submitted! Coins: ${data.newCoins}`);
      else Alert.alert('Failed', data.error);
    } catch (e) {
      Alert.alert('Network Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi, {username}</Text>
      <Text style={styles.coords}>
        {loc ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : 'Locating…'}
      </Text>
      <Picker
        selectedValue={level}
        onValueChange={v => setLevel(v)}
        style={styles.picker}
      >
        {OPTIONS.map(o => <Picker.Item key={o.value} label={o.label} value={o.value} />)}
      </Picker>

      <TouchableOpacity style={styles.btn} onPress={submit}>
        <Text style={styles.btnText}>Submit Survey (+1 coin)</Text>
      </TouchableOpacity>

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, { marginTop: 12 }]}
        onPress={() => navigation.navigate('Ranking', { user_id })}
      >
        <Text style={styles.btnText}>View Ranking</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#FFF' },
  title: { fontSize: 20, marginBottom: 12, textAlign: 'center' },
  coords: { textAlign: 'center', marginBottom: 12, color: '#555' },
  picker: { height: 50, width: '100%', borderWidth: 1, borderColor: '#888', marginBottom: 16 },
  btn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  msg: { marginTop: 16, textAlign: 'center', color: 'green' },
});
