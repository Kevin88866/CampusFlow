import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Pressable, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
const back = 'http://192.168.78.188:3000';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [conPassword, setConfirmPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const handleRegister = async () => {
    if (!username || !phone || !password || !conPassword) return Alert.alert('Error', 'Please fill in all fields');
    if (password !== conPassword) return Alert.alert('Error', 'Passwords do not match');
    if (!agreed) return Alert.alert('Error', 'You must agree to the Terms of Service and Privacy Policy');
    try {
      const res = await fetch(`${back}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', `Welcome, ${data.username}!`);
        navigation.replace('Login');
      } else Alert.alert('Registration Failed', data.error);
    } catch (e) {
      Alert.alert('Network Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register CampusFlow</Text>
      <View style={styles.inputBox}>
        <View style={styles.row}>
          <Icon name="account-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
        </View>
        <View style={styles.row}>
          <Icon name="phone-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Phone"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>
        <View style={styles.row}>
          <Icon name="lock-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>
        <View style={styles.row}>
          <Icon name="lock-check-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={conPassword}
            onChangeText={setConfirmPassword}
          />
        </View>
      </View>

      <Pressable style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
        <View style={styles.checkboxOuter}>
          {agreed ? (
            <Text style={{ fontSize: 18 }}>✓</Text>
          ) : null}
        </View>
        <Text style={styles.agreeText}>
          I agree to the 
          <Text style={styles.linkText} onPress={() => navigation.navigate('TermsOfService')}>
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text style={styles.linkText} onPress={() => navigation.navigate('PrivacyPolicy')}>
            Privacy Policy
          </Text>
        </Text>
      </Pressable>

      <TouchableOpacity
        style={[styles.btn, { opacity: agreed ? 1 : 0.6 }]}
        onPress={handleRegister}
        disabled={!agreed}
      >
        <Text style={styles.btnText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 26, fontWeight: '500', textAlign: 'center', marginBottom: 24 },
  inputBox: { borderWidth: 1, borderColor: '#DDD', borderRadius: 12, paddingVertical: 8, marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, borderBottomWidth: 1, borderColor: '#EEE', height: 48 },
  icon: { marginRight: 8 },
  input: { flex: 1, height: '100%' },
  agreeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  checkboxOuter: { borderColor: '#666', width: 24, height: 24, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  agreeText: { flexShrink: 1, color: '#333' },
  btn: { backgroundColor: '#6C63FF', borderRadius: 24, height: 48, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: '500' },
  linkText: { color: '#6C63FF', textDecorationLine: 'underline' },
});
