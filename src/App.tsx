
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import FlashMessage from 'react-native-flash-message';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './screens/DashboardScreen';
import TradingScreen from './screens/TradingScreen';
import WalletScreen from './screens/WalletScreen';
import SettingsScreen from './screens/SettingsScreen';
import { Web3Provider } from './providers/Web3Provider';
import { theme } from './theme/theme';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Web3Provider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                  let iconName;

                  if (route.name === 'Dashboard') {
                    iconName = focused ? 'analytics' : 'analytics-outline';
                  } else if (route.name === 'Trading') {
                    iconName = focused ? 'trending-up' : 'trending-up-outline';
                  } else if (route.name === 'Wallet') {
                    iconName = focused ? 'wallet' : 'wallet-outline';
                  } else if (route.name === 'Settings') {
                    iconName = focused ? 'settings' : 'settings-outline';
                  }

                  return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#2196F3',
                tabBarInactiveTintColor: 'gray',
                headerStyle: {
                  backgroundColor: '#2196F3',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              })}
            >
              <Tab.Screen 
                name="Dashboard" 
                component={DashboardScreen} 
                options={{ title: 'Dashboard' }}
              />
              <Tab.Screen 
                name="Trading" 
                component={TradingScreen} 
                options={{ title: 'Trading' }}
              />
              <Tab.Screen 
                name="Wallet" 
                component={WalletScreen} 
                options={{ title: 'Wallet' }}
              />
              <Tab.Screen 
                name="Settings" 
                component={SettingsScreen} 
                options={{ title: 'Settings' }}
              />
            </Tab.Navigator>
          </NavigationContainer>
          <StatusBar style="light" />
          <FlashMessage position="top" />
        </Web3Provider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
