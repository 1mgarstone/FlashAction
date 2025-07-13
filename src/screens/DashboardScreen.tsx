
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
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
} from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { useWeb3 } from '../providers/Web3Provider';
import { ArbitrageService } from '../services/ArbitrageService';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { isConnected, account } = useWeb3();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalProfit: 0,
    totalTrades: 0,
    successRate: 0,
    currentOpportunities: 0,
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
          <Title>Account</Title>
          <Text style={styles.address}>
            {account?.substring(0, 6)}...{account?.substring(38)}
          </Text>
          <Chip icon="ethereum" mode="outlined" style={styles.chip}>
            Ethereum Mainnet
          </Chip>
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
            >
              Start Bot
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
  button: {
    marginTop: 16,
    width: 200,
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
});
