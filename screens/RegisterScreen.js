import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../config';

export default function RegisterScreen({ navigation }) {
  const [stage, setStage] = useState('send');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [interest, setInterest] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Alert.alert('Error', 'Invalid email format');
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/send-register-otp`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email }) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to send code');
      setStage('verify');
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!email||!code||!username||!phone||!password||!confirmPassword) return Alert.alert('Error', 'All fields required');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');
    if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');
    if (!/^[0-9]{6}$/.test(code)) return Alert.alert('Error', 'Invalid code format');
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, code, username, phone, password, interest }) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Registration failed');
      navigation.reset({ index:0, routes:[{ name:'Login' }] });
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {stage === 'send' ? (
        <>
          <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
          <TouchableOpacity style={styles.btn} onPress={handleSendCode} disabled={loading}>
            {loading?<ActivityIndicator color="#FFF"/>:<Text style={styles.btnText}>Send Code</Text>}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput style={styles.input} placeholder="Code" keyboardType="numeric" value={code} onChangeText={setCode}/>
          <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername}/>
          <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone}/>
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword}/>
          <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword}/>
          <TextInput style={styles.input} placeholder="Interest" value={interest} onChangeText={setInterest}/>
          <TouchableOpacity style={styles.btn} onPress={handleVerifyAndRegister} disabled={loading}>
            {loading?<ActivityIndicator color="#FFF"/>:<Text style={styles.btnText}>Register</Text>}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,padding:24,justifyContent:'center',backgroundColor:'#FFF'},
  input:{height:48,borderColor:'#DDD',borderWidth:1,borderRadius:8,paddingHorizontal:12,marginBottom:12},
  btn:{backgroundColor:'#6C63FF',height:48,borderRadius:24,justifyContent:'center',alignItems:'center',marginTop:12},
  btnText:{color:'#FFF',fontSize:16,fontWeight:'500'},
});