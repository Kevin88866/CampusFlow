import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, PermissionsAndroid, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import { useIsFocused } from '@react-navigation/native';
const back = 'http://192.168.78.188:3000';
const radius = 0.01;

export default function MapScreen() {
  const [region, setRegion] = useState(null);
  const [markerCoord, setMarkerCoord] = useState(null);
  const [occupancyLevel, setOccupancyLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (Platform.OS === 'android') PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  }, []);

  const position = () => new Promise((res, rej) =>
    Geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true })
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const pos = await position();
      const { latitude, longitude } = pos.coords;
      const newRegion = { latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 };
      const resp = await fetch(`${back}/occupancy?lat=${latitude}&lon=${longitude}&radius=${radius}`);
      const json = await resp.json();

      setRegion(newRegion);
      setMarkerCoord({ latitude, longitude });
      
      if (!resp.ok) throw new Error(json.error || 'Fetch failed');
      setOccupancyLevel(json.level);
    } catch (e) {
      console.warn(e);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  if (loading || !region) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={region}
        onRegionChangeComplete={r => setRegion(r)}
      >
        {markerCoord && <Marker coordinate={markerCoord} pinColor="red" />}
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Occupancy: {occupancyLevel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 40, left: 16, right: 16, backgroundColor: '#ccc', padding: 12, borderRadius: 8, borderWidth: 2},
  overlayText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});