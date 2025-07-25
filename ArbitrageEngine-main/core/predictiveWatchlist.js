// Predictive Watchlist - Live predictions while operating (private)
const { getCurrentFlashLoanFee } = require('./flashloanAPI');
const { getSpread } = require('./dexScanner');
const { simulateTrade } = require('./simulateTrade');
const { updateTokenStats } = require('./learningMemory');
const { logInfo } = require('./logger');

const safetyBuffer = 0.02;
const gasCostPercent = 0.05;

function calculateMinimumSpread(fee) {
  return fee === 0
    ? gasCostPercent + safetyBuffer
    : fee + gasCostPercent + safetyBuffer;
}

// Private prediction checking (not visible in main logs)
async function checkPrediction(tokenPair) {
  try {
    const fee = await getCurrentFlashLoanFee(tokenPair);
    const spread = await getSpread(tokenPair);
    const requiredSpread = calculateMinimumSpread(fee);
    const sim = await simulateTrade(tokenPair);

    if (sim && sim.profitAfterFees > 0) {
      if (spread >= requiredSpread) {
        // This would trigger a real trade in the main engine
        // Just update internal stats here
        updateTokenStats(tokenPair, true, sim.profitAfterFees);
        return true;
      } else {
        // Private prediction logging - not visible to user
        const gap = requiredSpread - spread;
        const gapPercent = (gap / requiredSpread * 100).toFixed(2);
        
        // Internal tracking only
        updateTokenStats(tokenPair, false, sim.profitAfterFees);
        
        // Store prediction data internally
        storePredictionData(tokenPair, {
          currentSpread: spread,
          requiredSpread: requiredSpread,
          gap: gap,
          gapPercent: gapPercent,
          potentialProfit: sim.profitAfterFees,
          timestamp: Date.now()
        });
      }
    }
  } catch (err) {
    // Silent error handling for predictions
    storePredictionError(tokenPair, err.message);
  }
  
  return false;
}

// Internal prediction data storage (private)
const predictionStore = new Map();

function storePredictionData(tokenPair, data) {
  if (!predictionStore.has(tokenPair)) {
    predictionStore.set(tokenPair, []);
  }
  
  const predictions = predictionStore.get(tokenPair);
  predictions.push(data);
  
  // Keep only last 100 predictions per pair
  if (predictions.length > 100) {
    predictions.shift();
  }
}

function storePredictionError(tokenPair, error) {
  storePredictionData(tokenPair, {
    error: error,
    timestamp: Date.now()
  });
}

// Get prediction analytics (internal use only)
function getPredictionAnalytics(tokenPair) {
  const predictions = predictionStore.get(tokenPair) || [];
  
  if (predictions.length === 0) {
    return null;
  }
  
  const validPredictions = predictions.filter(p => !p.error);
  const avgGap = validPredictions.reduce((sum, p) => sum + p.gap, 0) / validPredictions.length;
  const avgPotentialProfit = validPredictions.reduce((sum, p) => sum + p.potentialProfit, 0) / validPredictions.length;
  
  return {
    totalPredictions: predictions.length,
    validPredictions: validPredictions.length,
    errorCount: predictions.length - validPredictions.length,
    averageGap: avgGap,
    averagePotentialProfit: avgPotentialProfit,
    lastPrediction: predictions[predictions.length - 1]
  };
}

// Continuous prediction monitoring (runs in background)
class PredictiveWatchlist {
  constructor() {
    this.isRunning = false;
    this.monitoredPairs = [];
    this.predictionInterval = 15000; // 15 seconds
  }

  addPair(tokenPair) {
    if (!this.monitoredPairs.includes(tokenPair)) {
      this.monitoredPairs.push(tokenPair);
    }
  }

  removePair(tokenPair) {
    const index = this.monitoredPairs.indexOf(tokenPair);
    if (index > -1) {
      this.monitoredPairs.splice(index, 1);
    }
  }

  async startMonitoring() {
    this.isRunning = true;
    
    while (this.isRunning) {
      try {
        // Check predictions for all monitored pairs
        const predictionPromises = this.monitoredPairs.map(pair => 
          checkPrediction(pair).catch(err => false)
        );
        
        await Promise.all(predictionPromises);
        
        // Wait before next prediction cycle
        await new Promise(resolve => setTimeout(resolve, this.predictionInterval));
      } catch (error) {
        // Silent error handling
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  stop() {
    this.isRunning = false;
  }

  // Get internal analytics (for system use only)
  getAnalytics() {
    const analytics = {};
    
    for (const pair of this.monitoredPairs) {
      analytics[pair] = getPredictionAnalytics(pair);
    }
    
    return analytics;
  }

  // Get prediction summary (internal)
  getSummary() {
    let totalPredictions = 0;
    let totalValid = 0;
    let totalErrors = 0;
    
    for (const pair of this.monitoredPairs) {
      const analytics = getPredictionAnalytics(pair);
      if (analytics) {
        totalPredictions += analytics.totalPredictions;
        totalValid += analytics.validPredictions;
        totalErrors += analytics.errorCount;
      }
    }
    
    return {
      monitoredPairs: this.monitoredPairs.length,
      totalPredictions,
      totalValid,
      totalErrors,
      successRate: totalPredictions > 0 ? (totalValid / totalPredictions * 100).toFixed(2) : 0
    };
  }
}

module.exports = {
  checkPrediction,
  PredictiveWatchlist,
  getPredictionAnalytics
};