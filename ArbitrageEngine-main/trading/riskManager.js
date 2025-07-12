
export class RiskManager {
  constructor() {
    this.maxDailyLoss = 0.05; // 5% of portfolio
    this.maxPositionSize = 0.2; // 20% of portfolio
    this.maxConcurrentTrades = 3;
    this.minProfitRatio = 0.02; // 2% minimum profit
    this.dailyStats = {
      trades: 0,
      wins: 0,
      losses: 0,
      totalProfit: 0,
      maxDrawdown: 0
    };
    this.activeTrades = [];
  }

  async assessRisk(opportunity, portfolioValue) {
    const risks = [];

    // Position size check
    if (opportunity.amount > portfolioValue * this.maxPositionSize) {
      risks.push({
        type: 'POSITION_SIZE',
        severity: 'HIGH',
        message: 'Position size exceeds maximum allowed'
      });
    }

    // Profit ratio check
    const profitRatio = opportunity.profit / opportunity.amount;
    if (profitRatio < this.minProfitRatio) {
      risks.push({
        type: 'LOW_PROFIT',
        severity: 'MEDIUM',
        message: 'Profit ratio below minimum threshold'
      });
    }

    // Daily loss limit check
    if (this.dailyStats.totalProfit < -portfolioValue * this.maxDailyLoss) {
      risks.push({
        type: 'DAILY_LOSS_LIMIT',
        severity: 'CRITICAL',
        message: 'Daily loss limit exceeded'
      });
    }

    // Concurrent trades check
    if (this.activeTrades.length >= this.maxConcurrentTrades) {
      risks.push({
        type: 'TOO_MANY_TRADES',
        severity: 'HIGH',
        message: 'Maximum concurrent trades reached'
      });
    }

    // Market volatility check
    const volatilityRisk = await this.assessMarketVolatility(opportunity);
    if (volatilityRisk.severity !== 'LOW') {
      risks.push(volatilityRisk);
    }

    return {
      approved: risks.filter(r => r.severity === 'CRITICAL').length === 0,
      risks,
      recommendedAction: this.getRecommendedAction(risks)
    };
  }

  async assessMarketVolatility(opportunity) {
    // Mock volatility assessment - in production, use real volatility metrics
    const volatility = Math.random();
    
    if (volatility > 0.8) {
      return {
        type: 'HIGH_VOLATILITY',
        severity: 'HIGH',
        message: 'Market volatility is extremely high'
      };
    } else if (volatility > 0.6) {
      return {
        type: 'MEDIUM_VOLATILITY',
        severity: 'MEDIUM',
        message: 'Market volatility is elevated'
      };
    } else {
      return {
        type: 'LOW_VOLATILITY',
        severity: 'LOW',
        message: 'Market volatility is acceptable'
      };
    }
  }

  getRecommendedAction(risks) {
    const criticalRisks = risks.filter(r => r.severity === 'CRITICAL');
    const highRisks = risks.filter(r => r.severity === 'HIGH');

    if (criticalRisks.length > 0) {
      return 'REJECT';
    } else if (highRisks.length > 2) {
      return 'REDUCE_SIZE';
    } else if (highRisks.length > 0) {
      return 'PROCEED_CAUTIOUSLY';
    } else {
      return 'APPROVE';
    }
  }

  recordTrade(trade) {
    this.dailyStats.trades++;
    this.dailyStats.totalProfit += trade.profit;

    if (trade.profit > 0) {
      this.dailyStats.wins++;
    } else {
      this.dailyStats.losses++;
    }

    // Update max drawdown
    if (trade.profit < 0) {
      this.dailyStats.maxDrawdown = Math.min(
        this.dailyStats.maxDrawdown,
        trade.profit
      );
    }

    this.activeTrades = this.activeTrades.filter(t => t.id !== trade.id);
  }

  startTrade(trade) {
    this.activeTrades.push({
      id: trade.id,
      startTime: Date.now(),
      amount: trade.amount
    });
  }

  getPerformanceMetrics() {
    const winRate = this.dailyStats.trades > 0 
      ? this.dailyStats.wins / this.dailyStats.trades 
      : 0;

    return {
      ...this.dailyStats,
      winRate,
      averageProfit: this.dailyStats.trades > 0 
        ? this.dailyStats.totalProfit / this.dailyStats.trades 
        : 0,
      activeTrades: this.activeTrades.length
    };
  }

  resetDailyStats() {
    this.dailyStats = {
      trades: 0,
      wins: 0,
      losses: 0,
      totalProfit: 0,
      maxDrawdown: 0
    };
  }
}
