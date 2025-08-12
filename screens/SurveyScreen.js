import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, PermissionsAndroid, Platform, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from '@react-native-community/geolocation';
import { API_BASE_URL } from '../config';
import { getPositionSmart } from '../location';

const back = API_BASE_URL;
const OPTIONS = [
  { label: 'Very Crowded (>75%)', value: 'Very Crowded (>75%)' },
  { label: 'Crowded (>50%)', value: 'Crowded (>50%)' },
  { label: 'Moderate (>25%)', value: 'Moderate (>25%)' },
  { label: 'Sparse (>0%)', value: 'Sparse (>0%)' }
];

export default function SurveyScreen({ route, navigation }) {
  const { user_id, username } = route.params;
  const [level, setLevel] = useState(OPTIONS[2].value);
  const [loc, setLoc] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  async function ensurePermission() {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      ]);
    } else {
      Geolocation.requestAuthorization('whenInUse');
    }
  }

  function getPositionFallback() {
    return new Promise((resolve, reject) =>
      Geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 })
    );
  }

  async function loadLocation() {
    setLoadingLoc(true);
    setMsg('');
    try {
      await ensurePermission();
      let pos;
      try {
        pos = await getPositionSmart();
      } catch (e) {
        const isTimeout = e && (e.code === 3 || String(e.message || '').toLowerCase().includes('timeout'));
        if (!isTimeout) throw e;
        pos = await getPositionFallback();
      }
      setLoc({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch (e) {
      Alert.alert('Location Error', e.message || 'Failed to get location');
    } finally {
      setLoadingLoc(false);
    }
  }

  useEffect(() => { loadLocation(); }, []);

  const submit = async () => {
    if (!loc) return Alert.alert('Location not ready');
    setSubmitting(true);
    setMsg('');
    try {
      const res = await fetch(`${back}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          occupancy_level: level
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit failed');
      setMsg('Submitted successfully');
    } catch (e) {
      Alert.alert('Submit Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hi {username || ''}</Text>
      {loadingLoc ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8 }}>Getting location...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.coords}>
            {loc ? `Lat: ${loc.latitude.toFixed(6)}, Lon: ${loc.longitude.toFixed(6)}` : 'Location unavailable'}
          </Text>
          <Picker
            selectedValue={level}
            onValueChange={setLevel}
            style={styles.picker}
          >
            {OPTIONS.map(o => (
              <Picker.Item key={o.value} label={o.label} value={o.value} />
            ))}
          </Picker>

          <TouchableOpacity style={[styles.btn, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting || !loc}>
            <Text style={styles.btnText}>{submitting ? 'Submitting...' : 'Submit Survey'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#0A84FF', marginTop: 12 }]} onPress={() => navigation.navigate('Ranking', { user_id })}>
            <Text style={styles.btnText}>View Ranking</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, { backgroundColor: '#777', marginTop: 12 }]} onPress={loadLocation} disabled={loadingLoc}>
            <Text style={styles.btnText}>{loadingLoc ? 'Refreshing...' : 'Refresh Location'}</Text>
          </TouchableOpacity>

          {!!msg && <Text style={styles.msg}>{msg}</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#FFF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, marginBottom: 12, textAlign: 'center' },
  coords: { textAlign: 'center', marginBottom: 12, color: '#555' },
  picker: { height: 50, width: '100%', marginBottom: 16 },
  btn: { backgroundColor: '#6C63FF', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  msg: { marginTop: 16, textAlign: 'center', color: 'green' }
});