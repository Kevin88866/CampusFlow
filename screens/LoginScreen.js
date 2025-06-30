import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
GoogleSignin.configure({
  scopes: ['email', 'profile'],
  webClientId: '878044548983-fgciu27al15tmued8b6o52fnji78f0nr.apps.googleusercontent.com',
  offlineAccess: true,
});
const back = 'http://192.168.78.188:3000';

export default function LoginScreen() {
  const navi = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter email and password');
    try {
      const resp = await fetch(`${back}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Login failed');
      navi.reset({ index: 0, routes: [{ name: 'MainTabs', params: { user_id: data.id } }] });
    } catch (err) {
      Alert.alert('Login Error', err.message);
    }
  };
  const GoogleLogin = async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut();
      const userInfo = await GoogleSignin.signIn();//make sure user is signed in, solve problem of gettokens
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('Failed to obtain ID token');
      const resp = await fetch(`${back}/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: idToken }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Google login failed');
      navi.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { user_id: data.id } }],
      });
    } catch (err) {
      console.log('>>> Google login err:', err);
      if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Google login error', err.message || err.toString());
      }
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login to CampusFlow</Text>

      <View style={styles.inputWrapper}>
        <Icon name="email-outline" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Account"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputWrapper}>
        <Icon name="lock-outline" size={20} color="#666" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity style={styles.forgotBtn} onPress={() => navi.navigate('ForgotPassword')}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
        <Text style={styles.loginBtnText}>Login</Text>
      </TouchableOpacity>

      <View style={styles.signupContainer}>
        <Text style={styles.signupText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navi.navigate('Register')}>
          <Text style={styles.signupLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.orContainer}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity style={styles.googleBtn} onPress={GoogleLogin}>
        <Image
          source={require('../assets/google.png')}
          style={styles.googleIcon}
        />
        <Text style={styles.googleBtnText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#FFF' },
  title: { fontSize: 28, fontWeight: '600', marginBottom: 32, textAlign: 'center' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderColor: '#DDD', borderWidth: 1, borderRadius: 8, marginBottom: 16, paddingHorizontal: 12 },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 48 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotText: { color: '#6C63FF' },
  loginBtn: { backgroundColor: '#6C63FF', height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  loginBtnText: { fontSize: 16, color: '#FFF', fontWeight: '500' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  signupText: { color: '#666' },
  signupLink: { color: '#6C63FF', fontWeight: '500' },
  orContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  line: { flex: 1, height: 1, backgroundColor: '#EEE' },
  orText: { marginHorizontal: 12, color: '#666', fontWeight: '500' },
  googleBtn: { flexDirection: 'row', borderColor: '#DDD', height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  googleIcon: { width: 24, height: 24, marginRight: 8 },
  googleBtnText: { fontSize: 16, color: '#333' },
});
