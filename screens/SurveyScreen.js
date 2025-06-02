import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Geolocation from '@react-native-community/geolocation';

const BACKEND_URL = 'http://10.0.2.2:3000';

const OCCUPANCY_OPTIONS = [
  { label: 'Very Crowded (>75%)', value: 'Very Crowded (>75%)' },
  { label: 'Crowded (>50%)', value: 'Crowded (>50%)' },
  { label: 'Moderate (>25%)', value: 'Moderate (>25%)' },
  { label: 'Sparse (>0%)', value: 'Sparse (>0%)' },
];

export default function SurveyScreen({ route }) {
  const { user_id, username, coins } = route.params;
  const [location, setLocation] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState('Very Crowded (>75%)');
  const [message, setMessage] = useState('');

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'CampusFlow Needs Location',
            message: 'CampusFlow needs your location to submit occupancy data.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        return false;
      }
    } else {
      return true;
    }
  };

  useEffect(() => {
    (async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Cannot get location.');
        return;
      }
      Geolocation.getCurrentPosition(
        (position) => {
          setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude,});
        },
        (error) => {
          Alert.alert('Location Error', error.message);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    })();
  }, []);

  const submitSurvey = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available.');
      return;
    }
    try {
      const payload = {
        user_id,
        latitude: location.latitude,
        longitude: location.longitude,
        occupancy_level: selectedLevel,
      };
      const res = await fetch(`${BACKEND_URL}/survey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Survey submitted! Coins: ${data.newCoins}`);
      } else {
        Alert.alert('Submission Failed', data.error || 'Unknown error');
      }
    } catch (err) {
      Alert.alert('Network Error', err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {username}</Text>

      {location ? (
        <Text style={styles.text}>
          Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
        </Text>
      ) : (
        <Text style={styles.text}>Fetching location…</Text>
      )}

      <Text style={styles.text}>Select occupancy level:</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={selectedLevel}
          onValueChange={(itemValue) => setSelectedLevel(itemValue)}
          style={styles.picker}
        >
          {OCCUPANCY_OPTIONS.map((opt) => (
            <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>

      <Button title="Submit Survey (+1 coin)" onPress={submitSurvey} />

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, marginBottom: 12, textAlign: 'center' },
  text: { marginBottom: 12, textAlign: 'center' },
  pickerWrapper: { borderWidth: 1, borderColor: '#888', borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  picker: { height: 50, width: '100%' },
  message: { marginTop: 16, textAlign: 'center', color: 'green' },
});
