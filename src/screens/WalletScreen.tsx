
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Card,
  Title,
  Text,
  Button,
  List,
  Divider,
  Surface,
  IconButton,
} from 'react-native-paper';
import * as Clipboard from 'expo-clipboard';
import { useWeb3 } from '../providers/Web3Provider';
import { WalletService } from '../services/WalletService';
import { showMessage } from 'react-native-flash-message';

interface TokenBalance {
  symbol: string;
  balance: string;
  value: number;
  icon: string;
}

export default function WalletScreen() {
  const { isConnected, account, connectWallet, disconnectWallet } = useWeb3();
  const [refreshing, setRefreshing] = useState(false);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [ethBalance, setEthBalance] = useState('0');

  useEffect(() => {
    if (isConnected && account) {
      loadWalletData();
    }
  }, [isConnected, account]);

  const loadWalletData = async () => {
    try {
      const walletService = new WalletService();
      const [ethBal, tokenBals, total] = await Promise.all([
        walletService.getEthBalance(account!),
        walletService.getTokenBalances(account!),
        walletService.getTotalValue(account!),
      ]);
      
      setEthBalance(ethBal);
      setBalances(tokenBals);
      setTotalValue(total);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      showMessage({
        message: 'Load Error',
        description: 'Failed to load wallet data',
        type: 'danger',
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const copyAddress = async () => {
    if (account) {
      await Clipboard.setStringAsync(account);
      showMessage({
        message: 'Address Copied',
        description: 'Wallet address copied to clipboard',
        type: 'success',
      });
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', onPress: disconnectWallet, style: 'destructive' },
      ]
    );
  };

  if (!isConnected) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content style={styles.centerContent}>
            <Title>Connect Your Wallet</Title>
            <Text style={styles.description}>
              Connect your Ethereum wallet to view balances and start trading
            </Text>
            <Button
              mode="contained"
              onPress={connectWallet}
              style={styles.connectButton}
              icon="wallet"
            >
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
      {/* Wallet Address */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.addressHeader}>
            <Title>Wallet Address</Title>
            <IconButton
              icon="content-copy"
              onPress={copyAddress}
              size={20}
            />
          </View>
          <Text style={styles.address}>
            {account?.substring(0, 6)}...{account?.substring(38)}
          </Text>
          <Button
            mode="outlined"
            onPress={handleDisconnect}
            style={styles.disconnectButton}
            icon="logout"
          >
            Disconnect
          </Button>
        </Card.Content>
      </Card>

      {/* Portfolio Value */}
      <Surface style={styles.portfolioCard}>
        <Text style={styles.portfolioLabel}>Total Portfolio Value</Text>
        <Text style={styles.portfolioValue}>${totalValue.toFixed(2)}</Text>
        <Text style={styles.ethBalance}>{ethBalance} ETH</Text>
      </Surface>

      {/* Token Balances */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Token Balances</Title>
          {balances.length === 0 ? (
            <Text style={styles.noTokens}>No tokens found</Text>
          ) : (
            balances.map((token, index) => (
              <View key={token.symbol}>
                <List.Item
                  title={token.symbol}
                  description={`${parseFloat(token.balance).toFixed(4)} tokens`}
                  left={props => <List.Icon {...props} icon={token.icon} />}
                  right={() => (
                    <View style={styles.tokenValue}>
                      <Text style={styles.tokenValueText}>
                        ${token.value.toFixed(2)}
                      </Text>
                    </View>
                  )}
                />
                {index < balances.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Recent Transactions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title>Recent Transactions</Title>
          <List.Item
            title="Arbitrage Trade"
            description="ETH/USDC • 2 minutes ago"
            left={props => <List.Icon {...props} icon="swap-horizontal" />}
            right={() => <Text style={styles.profitText}>+$45.32</Text>}
          />
          <Divider />
          <List.Item
            title="Flash Loan"
            description="Aave • 5 minutes ago"
            left={props => <List.Icon {...props} icon="flash" />}
            right={() => <Text style={styles.neutralText}>$0.00</Text>}
          />
          <Divider />
          <List.Item
            title="Token Swap"
            description="USDC → USDT • 1 hour ago"
            left={props => <List.Icon {...props} icon="repeat" />}
            right={() => <Text style={styles.neutralText}>-$2.15</Text>}
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
              icon="send"
            >
              Send
            </Button>
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="download"
            >
              Receive
            </Button>
          </View>
          <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="swap-horizontal"
            >
              Swap
            </Button>
            <Button
              mode="outlined"
              style={styles.actionButton}
              icon="history"
            >
              History
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
  description: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#666',
  },
  connectButton: {
    marginTop: 16,
    width: 200,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  address: {
    fontFamily: 'monospace',
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 16,
  },
  disconnectButton: {
    alignSelf: 'flex-start',
  },
  portfolioCard: {
    padding: 20,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 4,
    alignItems: 'center',
    backgroundColor: '#2196F3',
  },
  portfolioLabel: {
    color: 'white',
    fontSize: 14,
  },
  portfolioValue: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  ethBalance: {
    color: 'white',
    fontSize: 16,
    opacity: 0.8,
  },
  noTokens: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  tokenValue: {
    alignItems: 'flex-end',
  },
  tokenValueText: {
    fontWeight: 'bold',
    color: '#2196F3',
  },
  profitText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  neutralText: {
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 0.48,
  },
});
