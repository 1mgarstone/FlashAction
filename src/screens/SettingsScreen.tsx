
import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Switch,
  List,
  Divider,
  Button,
  TextInput,
  SegmentedButtons,
} from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [autoTrading, setAutoTrading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [slippageTolerance, setSlippageTolerance] = useState('0.5');
  const [maxGasPrice, setMaxGasPrice] = useState('50');
  const [network, setNetwork] = useState('mainnet');

  const saveSettings = async () => {
    try {
      const settings = {
        notifications,
        autoTrading,
        darkMode,
        slippageTolerance,
        maxGasPrice,
        network,
      };
      await AsyncStorage.setItem('app_settings', JSON.stringify(settings));
      showMessage({
        message: 'Settings Saved',
        description: 'Your preferences have been saved',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      showMessage({
        message: 'Save Failed',
        description: 'Failed to save settings',
        type: 'danger',
      });
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setNotifications(true);
            setAutoTrading(false);
            setDarkMode(false);
            setSlippageTolerance('0.5');
            setMaxGasPrice('50');
            setNetwork('mainnet');
            showMessage({
              message: 'Settings Reset',
              description: 'All settings have been reset to default',
              type: 'info',
            });
          },
          style: 'destructive',
        },
      ]
    );
  };

  const clearCache = async () => {
    try {
      await AsyncStorage.clear();
      showMessage({
        message: 'Cache Cleared',
        description: 'Application cache has been cleared',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showMessage({
        message: 'Clear Failed',
        description: 'Failed to clear cache',
        type: 'danger',
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* General Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>General</Title>
          
          <List.Item
            title="Push Notifications"
            description="Receive alerts for trading opportunities"
            right={() => (
              <Switch
                value={notifications}
                onValueChange={setNotifications}
              />
            )}
          />
          <Divider />
          
          <List.Item
            title="Auto Trading"
            description="Enable automatic trade execution"
            right={() => (
              <Switch
                value={autoTrading}
                onValueChange={setAutoTrading}
              />
            )}
          />
          <Divider />
          
          <List.Item
            title="Dark Mode"
            description="Use dark theme"
            right={() => (
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Trading Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Trading</Title>
          
          <TextInput
            label="Slippage Tolerance (%)"
            value={slippageTolerance}
            onChangeText={setSlippageTolerance}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
          />
          
          <TextInput
            label="Max Gas Price (Gwei)"
            value={maxGasPrice}
            onChangeText={setMaxGasPrice}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
          />
        </Card.Content>
      </Card>

      {/* Network Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Network</Title>
          <Text style={styles.label}>Preferred Network</Text>
          <SegmentedButtons
            value={network}
            onValueChange={setNetwork}
            buttons={[
              { value: 'mainnet', label: 'Mainnet' },
              { value: 'polygon', label: 'Polygon' },
              { value: 'arbitrum', label: 'Arbitrum' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      {/* Security Settings */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Security</Title>
          
          <List.Item
            title="Biometric Authentication"
            description="Use fingerprint or face ID"
            left={props => <List.Icon {...props} icon="fingerprint" />}
            right={() => <Switch value={false} onValueChange={() => {}} />}
          />
          <Divider />
          
          <List.Item
            title="Auto-lock Timeout"
            description="5 minutes"
            left={props => <List.Icon {...props} icon="lock-clock" />}
            onPress={() => {}}
          />
        </Card.Content>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>About</Title>
          
          <List.Item
            title="App Version"
            description="1.0.0"
            left={props => <List.Icon {...props} icon="information" />}
          />
          <Divider />
          
          <List.Item
            title="Terms of Service"
            left={props => <List.Icon {...props} icon="file-document" />}
            onPress={() => {}}
          />
          <Divider />
          
          <List.Item
            title="Privacy Policy"
            left={props => <List.Icon {...props} icon="shield-check" />}
            onPress={() => {}}
          />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={saveSettings}
              style={styles.actionButton}
              icon="content-save"
            >
              Save Settings
            </Button>
            <Button
              mode="outlined"
              onPress={resetSettings}
              style={styles.actionButton}
              icon="restore"
            >
              Reset
            </Button>
          </View>
          <Button
            mode="outlined"
            onPress={clearCache}
            style={styles.clearButton}
            icon="delete"
          >
            Clear Cache
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 4,
  },
  input: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  segmentedButtons: {
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 0.48,
  },
  clearButton: {
    marginTop: 8,
    alignSelf: 'center',
  },
});
