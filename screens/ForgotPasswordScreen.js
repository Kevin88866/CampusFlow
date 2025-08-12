import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { API_BASE_URL } from '../config';

export default function ForgotPasswordScreen({ navigation }) {
  const [stage, setStage] = useState('send');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Alert.alert('Error', 'Invalid email format');
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/send-reset-otp`, { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ email }) });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error||'Failed to send code');
      setStage('verify');
    } catch(err) {Alert.alert('Error',err.message);} finally{setLoading(false);}
  };

  const handleVerifyAndReset = async () => {
    if(!email||!code||!newPassword||!confirmPassword) return Alert.alert('Error','All fields required');
    if(newPassword!==confirmPassword) return Alert.alert('Error','Passwords do not match');
    if(newPassword.length<6) return Alert.alert('Error','Password must be at least 6 characters');
    if(!/^[0-9]{6}$/.test(code)) return Alert.alert('Error','Invalid code format');
    setLoading(true);
    try{
      const resp=await fetch(`${API_BASE_URL}/reset-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ email, code, newPassword })});
      const data=await resp.json();
      if(!resp.ok) throw new Error(data.error||'Reset failed');
      navigation.reset({ index:0, routes:[{ name:'Login' }] });
    }catch(err){Alert.alert('Error',err.message);}finally{setLoading(false);}
  };

  return(
    <View style={styles.container}>
      {stage==='send'?<>
        <TextInput style={styles.input} placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail}/>
        <TouchableOpacity style={styles.btn} onPress={handleSendCode} disabled={loading}>{loading?<ActivityIndicator color="#FFF"/>:<Text style={styles.btnText}>Send Code</Text>}</TouchableOpacity>
      </>:<>
        <TextInput style={styles.input} placeholder="Code" keyboardType="numeric" value={code} onChangeText={setCode}/>
        <TextInput style={styles.input} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword}/>
        <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword}/>
        <TouchableOpacity style={styles.btn} onPress={handleVerifyAndReset} disabled={loading}>{loading?<ActivityIndicator color="#FFF"/>:<Text style={styles.btnText}>Reset Password</Text>}</TouchableOpacity>
      </>}
    </View>
  );
}

const styles=StyleSheet.create({
  container:{flex:1,padding:24,backgroundColor:'#FFF',justifyContent:'center'},
  input:{height:48,borderColor:'#DDD',borderWidth:1,borderRadius:8,paddingHorizontal:12,marginBottom:12},
  btn:{backgroundColor:'#6C63FF',height:48,borderRadius:24,justifyContent:'center',alignItems:'center',marginTop:8},
  btnText:{color:'#FFF',fontSize:16,fontWeight:'500'},
});