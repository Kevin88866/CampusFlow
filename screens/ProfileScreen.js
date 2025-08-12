import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import { API_BASE_URL, AVATAR_PLACEHOLDER, toImageUrl } from '../config';

const back = API_BASE_URL;

export default function ProfileScreen({ route, navigation }) {
  const { user_id } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [interest, setInterest] = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);

  const loadUser = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${back}/users/${user_id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setUser(json);
      setName(json.name || '');
      setEmail(json.email || '');
      setPhone(json.phone || '');
      setInterest(json.interest || '');
      setAvatarUri(toImageUrl(json.avatarUrl) || '');
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, [user_id]);

  const pickAvatar = async () => {
    const res = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    if (res.didCancel || !res.assets || !res.assets.length) return;
    const f = res.assets[0];
    setAvatarUri(f.uri);
    setAvatarFile({ uri: f.uri, type: f.type || 'image/jpeg', name: f.fileName || 'avatar.jpg' });
  };

  const save = async () => {
    try {
      setLoading(true);
      let resp;
      if (avatarFile) {
        const fd = new FormData();
        fd.append('name', name);
        fd.append('email', email);
        fd.append('phone', phone);
        fd.append('interest', interest);
        fd.append('avatar', avatarFile);
        resp = await fetch(`${back}/users/${user_id}`, { method: 'PUT', body: fd });
      } else {
        resp = await fetch(`${back}/users/${user_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, interest })
        });
      }
      const json = await resp.json();
      if (!resp.ok) throw new Error(json.error || 'Save failed');
      setUser(json);
      setAvatarUri(toImageUrl(json.avatarUrl) || '');
      setAvatarFile(null);
      setIsEditing(false);
      Alert.alert('Saved successfully');
    } catch (e) {
      Alert.alert('Save Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  function logout() {
    navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (error) return (
    <View style={styles.center}>
      <Text style={styles.error}>Error: {error}</Text>
      <TouchableOpacity style={styles.btn} onPress={loadUser}><Text style={styles.btnText}>Retry</Text></TouchableOpacity>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={isEditing ? pickAvatar : undefined}>
        <Image source={avatarUri ? { uri: avatarUri } : AVATAR_PLACEHOLDER} style={styles.avatar} />
      </TouchableOpacity>

      <View style={styles.field}>
        <Text style={styles.label}>Username</Text>
        {isEditing ? <TextInput style={styles.input} value={name} onChangeText={setName} /> : <Text style={styles.value}>{user.name}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        {isEditing ? <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" /> : <Text style={styles.value}>{user.email}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone</Text>
        {isEditing ? <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" /> : <Text style={styles.value}>{user.phone}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Interests</Text>
        {isEditing ? <TextInput style={styles.input} value={interest} onChangeText={setInterest} placeholder="e.g. basketball" /> : <Text style={styles.value}>{user.interest || 'N/A'}</Text>}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Coins</Text>
        <Text style={styles.value}>{user.coins}</Text>
      </View>

      <View style={styles.buttonRow}>
        {isEditing ? (
          <TouchableOpacity style={styles.btn} onPress={save}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={() => setIsEditing(true)}><Text style={styles.btnText}>Edit Profile</Text></TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.logoutBtn]} onPress={logout}><Text style={styles.btnText}>Logout</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60, marginTop: 16, marginBottom: 16 },
  field: { width: '100%', marginBottom: 12 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  value: { fontSize: 16 },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, height: 40 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, width: '100%' },
  btn: { flex: 1, backgroundColor: '#6C63FF', borderRadius: 24, paddingVertical: 12, marginHorizontal: 4, alignItems: 'center' },
  logoutBtn: { backgroundColor: '#d9534f' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' }
});