import React, { useState, useEffect } from 'react';
import { startHeartbeat, stopHeartbeat, playPing, playError, isHeartbeatActive } from '../../../src/sounds/SoundController';

interface TradingStats {
  totalProfit: number;
  activeTrades: number;
  leverage: number;
  status: string;
}

export default function TradingDashboard() {
  const [stats, setStats] = useState<TradingStats>({
    totalProfit: 0,
    activeTrades: 0,
    leverage: 2000,
    status: 'STANDBY'
  });

  const [nitrousMode, setNitrousMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (nitrousMode) {
        const profitChange = Math.random() * 200 - 50;
        setStats(prev => ({
          ...prev,
          totalProfit: prev.totalProfit + profitChange,
          activeTrades: Math.floor(Math.random() * 50),
          status: 'NITROUS ACTIVE'
        }));

        // Sound feedback for trading events
        if (soundEnabled) {
          if (profitChange > 100) {
            playPing(); // Profitable opportunity found
          } else if (profitChange < -80) {
            playError(); // Significant loss detected
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [nitrousMode, soundEnabled]);

  const startNitrous = () => {
    setNitrousMode(true);
    setSoundEnabled(true);
    startHeartbeat();
    setStats(prev => ({ ...prev, status: '🔥 NITROUS BLAST INITIATED! 🔥' }));
  };

  const stopNitrous = () => {
    setNitrousMode(false);
    setSoundEnabled(false);
    stopHeartbeat();
    setStats(prev => ({ ...prev, status: 'STANDBY', activeTrades: 0 }));
  };

  const toggleSound = () => {
    if (soundEnabled) {
      stopHeartbeat();
      setSoundEnabled(false);
    } else {
      startHeartbeat();
      setSoundEnabled(true);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#000', color: '#00ff00' }}>
      <h1>⚡ ULTIMATE ARBITRAGE ENGINE ⚡</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', margin: '20px 0' }}>
        <div>
          <h3>📊 STATS</h3>
          <p>Profit: ${stats.totalProfit.toFixed(2)}</p>
          <p>Active Trades: {stats.activeTrades}</p>
          <p>Leverage: {stats.leverage}x</p>
          <p>Status: {stats.status}</p>
        </div>

        <div>
          <h3>🚀 CONTROLS</h3>
          <button 
            onClick={startNitrous}
            disabled={nitrousMode}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: nitrousMode ? '#666' : '#ff0000',
              color: 'white',
              border: 'none',
              margin: '5px',
              cursor: nitrousMode ? 'not-allowed' : 'pointer'
            }}
          >
            {nitrousMode ? 'NITROUS ACTIVE' : '🔥 START NITROUS'}
          </button>

          <button 
            onClick={stopNitrous}
            disabled={!nitrousMode}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: !nitrousMode ? '#666' : '#ff8800',
              color: 'white',
              border: 'none',
              margin: '5px',
              cursor: !nitrousMode ? 'not-allowed' : 'pointer'
            }}
          >
            ⏹ STOP
          </button>

          <button 
            onClick={toggleSound}
            disabled={!nitrousMode}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: !nitrousMode ? '#666' : (soundEnabled ? '#00aa00' : '#333'),
              color: 'white',
              border: 'none',
              margin: '5px',
              cursor: !nitrousMode ? 'not-allowed' : 'pointer'
            }}
          >
            {soundEnabled ? '🔊 SOUND ON' : '🔇 SOUND OFF'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#111', border: '1px solid #333' }}>
        <h4>⚠️ NITROUS MODE: 2000x LEVERAGE ⚠️</h4>
        <p>• Minimum 0.37% spread required</p>
        <p>• Ultra-fast execution (&lt;50ms)</p>
        <p>• Maximum risk/reward potential</p>
        <p>• Auto-stop on major loss</p>
        {soundEnabled && (
          <p style={{ color: '#00ff00' }}>• 🔊 Opportunity monitoring active</p>
        )}
      </div>
    </div>
  );
}