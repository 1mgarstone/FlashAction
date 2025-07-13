
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Surface,
  Text,
  Chip,
  ProgressBar,
  Modal,
  Portal,
  List,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useWeb3 } from '../providers/Web3Provider';
import { ArbitrageService } from '../services/ArbitrageService';

const { width } = Dimensions.get('window');

const NETWORKS = [
  { id: 1, name: 'Ethereum', chainId: 1, gasEstimate: '0.05 ETH' },
  { id: 137, name: 'Polygon', chainId: 137, gasEstimate: '0.1 MATIC' },
  { id: 56, name: 'BSC', chainId: 56, gasEstimate: '0.01 BNB' },
  { id: 43114, name: 'Avalanche', chainId: 43114, gasEstimate: '0.2 AVAX' },
  { id: 42161, name: 'Arbitrum', chainId: 42161, gasEstimate: '0.02 ETH' },
];

export default function DashboardScreen() {
  const { isConnected, account, switchNetwork } = useWeb3();
  const [refreshing, setRefreshing] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(1);
  const [deploying, setDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState('');
  const [tradingMode, setTradingMode] = useState('low-risk');
  const [stats, setStats] = useState({
    totalProfit: 0,
    totalTrades: 0,
    successRate: 0,
    currentOpportunities: 0,
    activeNetworks: 5,
    activeDEXs: 7,
  });
  const [priceData, setPriceData] = useState({
    labels: ['1h', '2h', '3h', '4h', '5h', '6h'],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  });

  useEffect(() => {
    if (isConnected) {
      loadDashboardData();
    }
  }, [isConnected]);

  const loadDashboardData = async () => {
    try {
      const arbitrageService = new ArbitrageService();
      const dashboardStats = await arbitrageService.getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const deploySmartContract = async () => {
    setDeploying(true);
    setDeploymentStatus('Switching to selected network...');
    
    try {
      // Switch to selected network
      await switchNetwork(selectedNetwork);
      
      setDeploymentStatus('Estimating gas costs...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const network = NETWORKS.find(n => n.id === selectedNetwork);
      setDeploymentStatus(`Deploying to ${network.name}...`);
      
      // Simulate contract deployment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      setDeploymentStatus('Contract deployed successfully!');
      
      Alert.alert(
        'Deployment Successful',
        `Smart contract deployed to ${network.name}!\nEstimated cost: ${network.gasEstimate}`,
        [{ text: 'OK', onPress: () => setDeployModalVisible(false) }]
      );
      
    } catch (error) {
      Alert.alert('Deployment Failed', error.message);
    } finally {
      setDeploying(false);
      setDeploymentStatus('');
    }
  };

  const startTrading = async () => {
    const mode = tradingMode === 'low-risk' ? 'Conservative' : 'Maximum Gain';
    const config = tradingMode === 'low-risk' 
      ? '5 DEXs, 3 Networks, Conservative thresholds'
      : '7 DEXs, 5 Networks, Maximum leverage, No cooldown';
    
    Alert.alert(
      `Start ${mode} Trading`,
      `Configuration: ${config}\n\nAre you ready to start automated trading?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Start Trading', 
          onPress: () => {
            Alert.alert('Trading Started', `${mode} mode activated!`);
          }
        }
      ]
    );
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.centerContent}>
            <Title>Welcome to Arbitrage Trading</Title>
            <Paragraph>Connect your wallet to start trading</Paragraph>
            <Button mode="contained" style={styles.button}>
              Connect Wallet
            </Button>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Account Info */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View>
              <Title>Account</Title>
              <Text style={styles.address}>
                {account?.substring(0, 6)}...{account?.substring(38)}
              </Text>
              <Chip icon="ethereum" mode="outlined" style={styles.chip}>
                Multi-Network
              </Chip>
            </View>
            <Button
              mode="contained"
              icon="cloud-upload"
              onPress={() => setDeployModalVisible(true)}
              style={styles.deployButton}
            >
              Deploy Contract
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Trading Mode Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Trading Mode</Title>
          <RadioButton.Group 
            onValueChange={setTradingMode} 
            value={tradingMode}
          >
            <View style={styles.radioRow}>
              <RadioButton value="low-risk" />
              <View style={styles.radioContent}>
                <Text style={styles.radioTitle}>Low Risk Mode</Text>
                <Text style={styles.radioDescription}>
                  Conservative trading • 5 DEXs • 3 Networks
                </Text>
              </View>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="high-risk" />
              <View style={styles.radioContent}>
                <Text style={styles.radioTitle}>Maximum Gain Mode</Text>
                <Text style={styles.radioDescription}>
                  Aggressive trading • 7 DEXs • 5 Networks • No cooldown
                </Text>
              </View>
            </View>
          </RadioButton.Group>
        </Card.Content>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>${stats.totalProfit.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Profit</Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalTrades}</Text>
          <Text style={styles.statLabel}>Total Trades</Text>
        </Surface>
      </View>

      <View style={styles.statsGrid}>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>{stats.successRate.toFixed(1)}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
          <ProgressBar
            progress={stats.successRate / 100}
            color="#4CAF50"
            style={styles.progressBar}
          />
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>{stats.currentOpportunities}</Text>
          <Text style={styles.statLabel}>Live Opportunities</Text>
        </Surface>
      </View>

      <View style={styles.statsGrid}>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeNetworks}</Text>
          <Text style={styles.statLabel}>Active Networks</Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statValue}>{stats.activeDEXs}</Text>
          <Text style={styles.statLabel}>Active DEXs</Text>
        </Surface>
      </View>

      {/* Price Chart */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Arbitrage Opportunities (6h)</Title>
          <LineChart
            data={priceData}
            width={width - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#2196F3',
              },
            }}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Quick Actions</Title>
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              style={styles.actionButton}
              icon="flash"
              onPress={startTrading}
            >
              Start {tradingMode === 'low-risk' ? 'Safe' : 'Max'} Trading
            </Button>
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="chart-line"
            >
              View Analytics
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* Deploy Contract Modal */}
      <Portal>
        <Modal
          visible={deployModalVisible}
          onDismiss={() => !deploying && setDeployModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title>Deploy Smart Contract</Title>
          
          {!deploying ? (
            <>
              <Text style={styles.modalText}>
                Select network to deploy your arbitrage contract:
              </Text>
              
              {NETWORKS.map((network) => (
                <List.Item
                  key={network.id}
                  title={network.name}
                  description={`Estimated cost: ${network.gasEstimate}`}
                  left={() => (
                    <RadioButton
                      value={network.id}
                      status={selectedNetwork === network.id ? 'checked' : 'unchecked'}
                      onPress={() => setSelectedNetwork(network.id)}
                    />
                  )}
                  onPress={() => setSelectedNetwork(network.id)}
                />
              ))}
              
              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => setDeployModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={deploySmartContract}
                  style={styles.modalButton}
                >
                  Deploy
                </Button>
              </View>
            </>
          ) : (
            <View style={styles.deployingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.deployingText}>{deploymentStatus}</Text>
            </View>
          )}
        </Modal>
      </Portal>
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
  centerContent: {
    alignItems: 'center',
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  button: {
    marginTop: 16,
    width: 200,
  },
  deployButton: {
    alignSelf: 'flex-start',
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  chip: {
    alignSelf: 'flex-start',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioContent: {
    marginLeft: 8,
    flex: 1,
  },
  radioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  radioDescription: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 0.48,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    marginTop: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 0.48,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalText: {
    marginVertical: 16,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 0.48,
  },
  deployingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  deployingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
});
