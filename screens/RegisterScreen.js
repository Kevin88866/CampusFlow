import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { API_BASE_URL } from '../config'
const back = API_BASE_URL

export default function RegisterScreen({ navigation }) {
  const [stage, setStage] = useState('send'); // 'send' or 'verify'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      return Alert.alert('Error', 'Please enter your email');
    }
    try {
      setLoading(true);
      const res = await fetch(`${back}/send-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to send code');
      Alert.alert('Success', 'Verification code sent. Please check your inbox.');
      setStage('verify');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!code || !username || !phone || !password || !confirmPassword || !interest) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }
    try {
      setLoading(true);
      const res = await fetch(`${back}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, username, phone, password, interest }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Verification failed');
      Alert.alert('Success', 'Registration complete! You can now log in.');
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register CampusFlow</Text>

      {stage === 'send' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TouchableOpacity style={styles.btn} onPress={handleSendCode}>
            <Text style={styles.btnText}>Send Verification Code</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Verification Code"
            keyboardType="number-pad"
            value={code}
            onChangeText={setCode}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="Interests (e.g. basketball)"
            value={interest}
            onChangeText={setInterest}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.btn} onPress={handleVerifyAndRegister}>
            <Text style={styles.btnText}>Complete Registration</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '500', textAlign: 'center', marginBottom: 24 },
  input: { height: 48, borderColor: '#DDD', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  btn: { backgroundColor: '#6C63FF', borderRadius: 24, height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
});