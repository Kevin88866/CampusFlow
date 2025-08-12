import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import { startLocationPrefetch } from '../location';

const CACHE_KEY = 'last_location';
const ZOOM = { latitudeDelta: 0.005, longitudeDelta: 0.005 };
const FRESH_MS = 8000;

export default function MapScreen() {
  const isFocused = useIsFocused();
  const [mapKey, setMapKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [marker, setMarker] = useState(null);
  const [isStale, setIsStale] = useState(false);
  const [occupancy, setOccupancy] = useState(null);
  const mapRef = useRef(null);
  const initialRegionRef = useRef(null);
  const pollRef = useRef(null);
  const lastAppliedRef = useRef(null);

  useEffect(() => {
    startLocationPrefetch();
    bootstrapInitial();
  }, []);

  useEffect(() => {
    if (!isFocused) {
      clearInterval(pollRef.current);
      pollRef.current = null;
      return;
    }
    ensureInitialAndRemount();
    startPolling();
    return () => {
      clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [isFocused]);

  async function bootstrapInitial() {
    const mem = global.__lastLocation;
    if (mem && isFinite(mem.lat) && isFinite(mem.lon) && (mem.lat || mem.lon)) {
      const ts = mem.ts || 0;
      initialRegionRef.current = { latitude: mem.lat, longitude: mem.lon, ...ZOOM };
      setMarker({ latitude: mem.lat, longitude: mem.lon });
      setIsStale(Date.now() - ts > FRESH_MS);
      setReady(true);
      lastAppliedRef.current = { lat: mem.lat, lon: mem.lon, ts };
      fetchOccupancy(mem.lat, mem.lon);
      return;
    }
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const o = JSON.parse(raw);
        if (typeof o.lat === 'number' && typeof o.lon === 'number' && isFinite(o.lat) && isFinite(o.lon)) {
          const ts = o.ts || 0;
          initialRegionRef.current = { latitude: o.lat, longitude: o.lon, ...ZOOM };
          setMarker({ latitude: o.lat, longitude: o.lon });
          setIsStale(Date.now() - ts > FRESH_MS);
          setReady(true);
          lastAppliedRef.current = { lat: o.lat, lon: o.lon, ts };
          fetchOccupancy(o.lat, o.lon);
        }
      }
    } catch {}
  }

  async function ensureInitialAndRemount() {
    if (initialRegionRef.current) {
      setMapKey(k => k + 1);
      return;
    }
    await bootstrapInitial();
    if (initialRegionRef.current) setMapKey(k => k + 1);
  }

  function animateTo(lat, lon) {
    if (!mapRef.current) return;
    mapRef.current.animateToRegion({ latitude: lat, longitude: lon, ...ZOOM }, 600);
  }

  async function fetchOccupancy(lat, lon) {
    try {
      const resp = await fetch(`${API_BASE_URL}/occupancy?lat=${lat}&lon=${lon}&radius=0.01`);
      const json = await resp.json();
      if (resp.ok) setOccupancy(json.level);
    } catch {}
  }

  function startPolling() {
    if (pollRef.current) return;
    const first = global.__lastLocation;
    if (first && isFinite(first.lat) && isFinite(first.lon)) {
      fetchOccupancy(first.lat, first.lon);
    }
    pollRef.current = setInterval(async () => {
      const loc = global.__lastLocation;
      if (!loc || !isFinite(loc.lat) || !isFinite(loc.lon)) return;
      const last = lastAppliedRef.current;
      const hasNewer = last ? ((loc.ts || 0) > (last.ts || 0)) : true;
      const changed = !last || Math.abs(loc.lat - last.lat) > 0.00005 || Math.abs(loc.lon - last.lon) > 0.00005;
      if (!(hasNewer || changed)) return;
      setMarker({ latitude: loc.lat, longitude: loc.lon });
      setIsStale(false);
      lastAppliedRef.current = { lat: loc.lat, lon: loc.lon, ts: loc.ts || 0 };
      if (initialRegionRef.current) animateTo(loc.lat, loc.lon);
      else {
        initialRegionRef.current = { latitude: loc.lat, longitude: loc.lon, ...ZOOM };
        setReady(true);
        setMapKey(k => k + 1);
      }
      fetchOccupancy(loc.lat, loc.lon);
    }, 1000);
  }

  if (!ready || !initialRegionRef.current) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8 }}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        key={mapKey}
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegionRef.current}
      >
        {marker && <Marker coordinate={marker} pinColor="red" />}
      </MapView>
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Occupancy: {occupancy || '-'}</Text>
        {isStale && <Text style={styles.stale}>Showing cached location</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 40, left: 16, right: 16, backgroundColor: '#ccc', padding: 12, borderRadius: 8, borderWidth: 2 },
  overlayText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  stale: { marginTop: 6, fontSize: 12, textAlign: 'center', color: '#555' }
});