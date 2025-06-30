import React from 'react';
import { NavigationContainer, RouteProp } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { TimerProvider } from './TimerContext';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MapScreen from './screens/MapScreen';
import SurveyScreen from './screens/SurveyScreen';
import PomodoroScreen from './screens/PomodoroScreen';
import NearbyUsersScreen from './screens/NearbyUsersScreen';
import ProfileScreen from './screens/ProfileScreen';
import UserProfileScreen from './screens/UserProfileScreen';
import ChatScreen from './screens/ChatScreen';
import ChatListScreen from './screens/ChatListScreen';
import { TermsOfServiceScreen } from './screens/TermsOfServiceScreen';
import { PrivacyPolicyScreen } from './screens/PrivacyPolicyScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export type TabParamList = {
  Map: { user_id: number };
  Survey: { user_id: number; username: string };
  Pomodoro: { user_id: number };
  Buddies: { user_id: number };
  Profile: { user_id: number };
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: { user_id: number; username: string; coins: number };
  Chat: { user_id: number; peer_id: number; peerName: string };
  UserProfile: { user_id: number; userId: number; name?: string };
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();
const BuddiesStack = createStackNavigator<any>();

function BuddiesNavigator({ route }: { route: any }) {
  const { user_id } = route.params;
  return (
    <BuddiesStack.Navigator>
      <BuddiesStack.Screen
        name="ChatList"
        component={ChatListScreen}
        initialParams={{ user_id }}
        options={{ title: 'Conversations' }}
      />
      <BuddiesStack.Screen
        name="NearbyUsers"
        component={NearbyUsersScreen}
        initialParams={{ user_id }}
        options={{ title: 'Find Buddies' }}
      />
    </BuddiesStack.Navigator>
  );
}

function MainTabs({ route }: { route: RouteProp<RootStackParamList, 'MainTabs'> }) {
  const { user_id, username, coins } = route.params;
  return (
    <Tab.Navigator
      initialRouteName="Map"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'Map':
              iconName = 'map-outline';
              break;
            case 'Survey':
              iconName = 'clipboard-list-outline';
              break;
            case 'Pomodoro':
              iconName = 'timer-outline';
              break;
            case 'Buddies':
              iconName = 'account-group-outline';
              break;
            case 'Profile':
              iconName = 'account-outline';
              break;
            default:
              iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#6C63FF",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} initialParams={{ user_id }} />
      <Tab.Screen
        name="Survey"
        component={SurveyScreen}
        initialParams={{ user_id, username }}
      />
      <Tab.Screen name="Pomodoro" component={PomodoroScreen} initialParams={{ user_id }} />
      <Tab.Screen name="Buddies" component={BuddiesNavigator} initialParams={{ user_id }} />
      <Tab.Screen name="Profile" component={ProfileScreen} initialParams={{ user_id }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TimerProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="MainTabs"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }: { route: RouteProp<RootStackParamList, 'Chat'> }) => ({
                title: route.params.peerName,
              })}
            />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{ title: 'User Profile' }}
            />
            <Stack.Screen
              name="TermsOfService"
              component={TermsOfServiceScreen}
              options={{ title: 'Terms of Service' }}
            />
            <Stack.Screen
              name="PrivacyPolicy"
              component={PrivacyPolicyScreen}
              options={{ title: 'Privacy Policy' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </TimerProvider>
    </GestureHandlerRootView>
  );
}
