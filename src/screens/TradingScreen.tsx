
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Title,
  Button,
  Switch,
  Text,
  Divider,
  List,
  Badge,
  TextInput,
} from 'react-native-paper';
import { useWeb3 } from '../providers/Web3Provider';
import { ArbitrageService } from '../services/ArbitrageService';
import { showMessage } from 'react-native-flash-message';

interface ArbitrageOpportunity {
  id: string;
  tokenPair: string;
  exchange1: string;
  exchange2: string;
  price1: number;
  price2: number;
  profit: number;
  profitPercentage: number;
  gasEstimate: number;
}

export default function TradingScreen() {
  const { isConnected, signer } = useWeb3();
  const [refreshing, setRefreshing] = useState(false);
  const [isAutoBotEnabled, setIsAutoBotEnabled] = useState(false);
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [minProfit, setMinProfit] = useState('10');
  const [maxGasPrice, setMaxGasPrice] = useState('50');
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (isConnected) {
      loadOpportunities();
      const interval = setInterval(loadOpportunities, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  const loadOpportunities = async () => {
    try {
      const arbitrageService = new ArbitrageService();
      const ops = await arbitrageService.findOpportunities();
      setOpportunities(ops);
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOpportunities();
    setRefreshing(false);
  };

  const executeArbitrage = async (opportunity: ArbitrageOpportunity) => {
    if (!signer) {
      showMessage({
        message: 'Wallet Required',
        description: 'Please connect your wallet first',
        type: 'warning',
      });
      return;
    }

    setIsExecuting(true);
    try {
      const arbitrageService = new ArbitrageService();
      const result = await arbitrageService.executeArbitrage(opportunity, signer);
      
      if (result.success) {
        showMessage({
          message: 'Trade Executed',
          description: `Profit: $${result.profit?.toFixed(2)}`,
          type: 'success',
        });
      } else {
        showMessage({
          message: 'Trade Failed',
          description: result.error || 'Unknown error',
          type: 'danger',
        });
      }
    } catch (error) {
      console.error('Failed to execute arbitrage:', error);
      showMessage({
        message: 'Execution Error',
        description: 'Failed to execute arbitrage trade',
        type: 'danger',
      });
    } finally {
      setIsExecuting(false);
      await loadOpportunities();
    }
  };

  const toggleAutoBot = async () => {
    setIsAutoBotEnabled(!isAutoBotEnabled);
    if (!isAutoBotEnabled) {
      showMessage({
        message: 'Auto Bot Started',
        description: 'Monitoring for arbitrage opportunities',
        type: 'success',
      });
    } else {
      showMessage({
        message: 'Auto Bot Stopped',
        description: 'Manual trading mode enabled',
        type: 'info',
      });
    }
  };

  const getProfitColor = (profit: number) => {
    if (profit > 50) return '#4CAF50';
    if (profit > 20) return '#FF9800';
    return '#F44336';
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.centerContent}>
            <Title>Trading Dashboard</Title>
            <Text>Connect your wallet to start trading</Text>
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
      {/* Auto Bot Controls */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Auto Trading Bot</Title>
          <View style={styles.switchContainer}>
            <Text>Enable Auto Bot</Text>
            <Switch
              value={isAutoBotEnabled}
              onValueChange={toggleAutoBot}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.settingsContainer}>
            <TextInput
              label="Min Profit ($)"
              value={minProfit}
              onChangeText={setMinProfit}
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
          </View>
        </Card.Content>
      </Card>

      {/* Arbitrage Opportunities */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Live Opportunities ({opportunities.length})</Title>
          {opportunities.length === 0 ? (
            <Text style={styles.noOpportunities}>
              No profitable opportunities found
            </Text>
          ) : (
            opportunities.map((opportunity) => (
              <View key={opportunity.id} style={styles.opportunityCard}>
                <View style={styles.opportunityHeader}>
                  <Text style={styles.tokenPair}>{opportunity.tokenPair}</Text>
                  <Badge
                    style={[
                      styles.profitBadge,
                      { backgroundColor: getProfitColor(opportunity.profit) }
                    ]}
                  >
                    ${opportunity.profit.toFixed(2)}
                  </Badge>
                </View>
                
                <View style={styles.exchangeInfo}>
                  <Text style={styles.exchange}>
                    {opportunity.exchange1}: ${opportunity.price1.toFixed(4)}
                  </Text>
                  <Text style={styles.exchange}>
                    {opportunity.exchange2}: ${opportunity.price2.toFixed(4)}
                  </Text>
                </View>
                
                <View style={styles.opportunityFooter}>
                  <Text style={styles.gasEstimate}>
                    Gas: ${opportunity.gasEstimate.toFixed(2)}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={() => executeArbitrage(opportunity)}
                    disabled={isExecuting || isAutoBotEnabled}
                    style={styles.executeButton}
                    compact
                  >
                    Execute
                  </Button>
                </View>
                
                <Divider style={styles.divider} />
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Recent Trades */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Trades</Title>
          <List.Item
            title="ETH/USDC"
            description="Profit: $45.32 • 2 minutes ago"
            left={props => <List.Icon {...props} icon="trending-up" />}
            right={props => <Text style={styles.profitText}>+$45.32</Text>}
          />
          <List.Item
            title="WBTC/USDT"
            description="Profit: $23.18 • 5 minutes ago"
            left={props => <List.Icon {...props} icon="trending-up" />}
            right={props => <Text style={styles.profitText}>+$23.18</Text>}
          />
          <List.Item
            title="LINK/DAI"
            description="Profit: $12.45 • 8 minutes ago"
            left={props => <List.Icon {...props} icon="trending-up" />}
            right={props => <Text style={styles.profitText}>+$12.45</Text>}
          />
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  divider: {
    marginVertical: 12,
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    flex: 0.48,
  },
  noOpportunities: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  opportunityCard: {
    marginVertical: 8,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenPair: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profitBadge: {
    color: 'white',
  },
  exchangeInfo: {
    marginBottom: 8,
  },
  exchange: {
    fontSize: 14,
    color: '#666',
  },
  opportunityFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gasEstimate: {
    fontSize: 12,
    color: '#666',
  },
  executeButton: {
    height: 32,
  },
  profitText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
