import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid } from 'react-native';
let watchId = null;
let started = false;
const CACHE_KEY = 'last_location';

export function getPositionSmart() {
  return new Promise((resolve, reject) => {
    let settled = false;
    const ok = p => { if (settled) return; settled = true; resolve(p); };
    const fail = e => { if (settled) return; settled = true; reject(e); };

    Geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 });

    setTimeout(() => {
      if (settled) return;
      Geolocation.getCurrentPosition(ok, fail, { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 });
    }, 3000);
  });
}

export async function startLocationPrefetch() {
  if (started) return;
  started = true;
  try {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      ]);
    } else {
      Geolocation.requestAuthorization('whenInUse');
    }
  } catch {}
  try {
    const pos = await getPositionSmart();
    const { latitude, longitude } = pos.coords;
    global.__lastLocation = { lat: latitude, lon: longitude, ts: Date.now() };
    try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(global.__lastLocation)); } catch {}
  } catch {}
  watchId = Geolocation.watchPosition(
    p => {
      const { latitude, longitude } = p.coords;
      global.__lastLocation = { lat: latitude, lon: longitude, ts: Date.now() };
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify(global.__lastLocation)).catch(() => {});
    },
    () => {},
    { enableHighAccuracy: true, distanceFilter: 10, timeout: 30000, maximumAge: 0 }
  );
}

export function stopLocationPrefetch() {
  if (watchId != null) {
    Geolocation.clearWatch(watchId);
    watchId = null;
  }
  started = false;
}
