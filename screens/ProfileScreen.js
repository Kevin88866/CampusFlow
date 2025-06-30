import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { CommonActions } from '@react-navigation/native';
const back = 'http://192.168.78.188:3000';

export default function ProfileScreen({ route, navigation }) {
  const { user_id } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const loadUser = () => {
    setLoading(true);
    fetch(`${back}/users/${user_id}`)
      .then(res => res.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setUser(json);
        setName(json.name || json.username || '');
        setEmail(json.email || '');
        setPhone(json.phone || '');
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUser();
  }, [user_id]);

  function logout() {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
          },
        },
      ]
    );
  }

  const save = () => {
    setLoading(true);
    fetch(`${back}/users/${user_id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone }),
    })
      .then(res => {
        if (!res.ok) throw new Error(`Save failed: ${res.status}`);
        return res.json();
      })
      .then(json => {
        Alert.alert('Saved successfully');
        setIsEditing(false);
        setUser(json);
      })
      .catch(err => Alert.alert('Save Error', err.message))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={'#6C63FF'} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
        <TouchableOpacity style={styles.btn} onPress={loadUser}>
          <Text style={styles.btnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Username:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
          />
        ) : (
          <Text style={styles.value}>{user.name || user.username}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Email:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
        ) : (
          <Text style={styles.value}>{user.email || 'N/A'}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Phone:</Text>
        {isEditing ? (
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        ) : (
          <Text style={styles.value}>{user.phone || 'N/A'}</Text>
        )}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Coins:</Text>
        <Text style={styles.value}>{user.coins}</Text>
      </View>

      <View style={styles.buttonRow}>
        {isEditing ? (
          <TouchableOpacity style={styles.btn} onPress={save}>
            <Text style={styles.btnText}>Save</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btn} onPress={() => setIsEditing(true)}>
            <Text style={styles.btnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.logoutBtn]} onPress={logout}>
          <Text style={styles.btnText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  value: { fontSize: 16 },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, height: 40 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  btn: { flex: 1, backgroundColor: '#6C63FF', borderRadius: 24, paddingVertical: 12, marginHorizontal: 4, alignItems: 'center' },
  logoutBtn: { backgroundColor: '#d9534f' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
});
