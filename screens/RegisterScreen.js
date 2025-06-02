import React, { useState } from 'react';  
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';  
const BACKEND_URL = 'http://10.0.2.2:3000';

export default function RegisterScreen({ navigation }) {  
  const [username, setUsername] = useState('');  
  const [password, setPassword] = useState('');  
  
  const handleRegister = async () => {  
    if (!username || !password) {  
      Alert.alert('Error', 'Username and password cannot be empty');  
      return;  
    }  
    try {  
      const res = await fetch(`${BACKEND_URL}/register`, {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({ username, password })  
      });  
      const data = await res.json();  
      if (res.ok) {  
        Alert.alert('Success', `Registered ${data.username}`);  
        navigation.replace('Login');  
      } else {  
        Alert.alert('Registration Failed', data.error || 'Unknown error');  
      }  
    } catch (err) {  
      Alert.alert('Network Error', err.message);  
    }  
  };  
  
  return (  
    <View style={styles.container}>  
      <Text style={styles.title}>CampusFlow Register</Text>  
      <TextInput  
        placeholder="Username"  
        value={username}  
        onChangeText={setUsername}  
        style={styles.input}  
        autoCapitalize="none"  
      />  
      <TextInput  
        placeholder="Password"  
        value={password}  
        onChangeText={setPassword}  
        secureTextEntry  
        style={styles.input}  
      />  
      <Button title="Register" onPress={handleRegister} />  
    </View>  
  );  
}  
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  title: { fontSize: 24, marginBottom: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 8, marginBottom: 12 },
  link: { marginTop: 16, color: 'blue', textAlign: 'center' },
  message: { marginTop: 16, textAlign: 'center', color: 'green' }
});
