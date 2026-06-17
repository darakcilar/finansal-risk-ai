import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import FormScreen from '../screens/FormScreen'; // Eski HomeScreen
import MarketDataScreen from '../screens/MarketDataScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return null; // Veya bir splash/loading ekranı eklenebilir
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {user ? (
          user.hasSeenOnboarding ? (
            // Kullanıcı giriş yapmış ve onboarding'i görmüş
            <>
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Form" component={FormScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="MarketData" component={MarketDataScreen} />
              <Stack.Screen name="Stats" component={StatsScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
            </>
          ) : (
            // Giriş yapmış ama henüz onboarding görmemiş
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )
        ) : (
          // Giriş yapmamış kullanıcı
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
