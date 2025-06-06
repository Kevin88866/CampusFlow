import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';  
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';  
import SurveyScreen from './screens/SurveyScreen';
  
const Stack = createStackNavigator();  
  
export default function App() {  
  return (  
    <NavigationContainer>  
      <Stack.Navigator initialRouteName="Login">  
        <Stack.Screen name="Login" component={LoginScreen} />  
        <Stack.Screen name="Register" component={RegisterScreen} />  
        <Stack.Screen name="Survey" component={SurveyScreen} />  
      </Stack.Navigator>  
    </NavigationContainer>  
  );  
}  