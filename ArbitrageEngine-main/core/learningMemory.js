// Learning Memory - Tracks token performance over time
const fs = require('fs');
const path = require('path');

const MEMORY_FILE = path.join(__dirname, '../memory/tokenPerformance.json');

// Ensure memory directory exists
const memoryDir = path.dirname(MEMORY_FILE);
if (!fs.existsSync(memoryDir)) {
  fs.mkdirSync(memoryDir, { recursive: true });
}

// Load existing memory or initialize empty
let memory = {};
try {
  if (fs.existsSync(MEMORY_FILE)) {
    memory = JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'));
  }
} catch (error) {
  console.error('Error loading memory file:', error.message);
  memory = {};
}

// Update token statistics
function updateTokenStats(pair, wasProfitable, profit = 0) {
  if (!memory[pair]) {
    memory[pair] = {
      attempts: 0,
      wins: 0,
      losses: 0,
      total_profit: 0,
      avg_profit: 0,
      best_profit: 0,
      worst_loss: 0,
      last_seen: Date.now(),
      first_seen: Date.now(),
      success_rate: 0,
      profit_factor: 0,
      consecutive_wins: 0,
      consecutive_losses: 0,
      max_consecutive_wins: 0,
      max_consecutive_losses: 0
    };
  }

  const data = memory[pair];
  data.attempts++;
  data.last_seen = Date.now();

  if (wasProfitable && profit > 0) {
    data.wins++;
    data.total_profit += profit;
    data.consecutive_wins++;
    data.consecutive_losses = 0;
    
    if (profit > data.best_profit) {
      data.best_profit = profit;
    }
    
    if (data.consecutive_wins > data.max_consecutive_wins) {
      data.max_consecutive_wins = data.consecutive_wins;
    }
  } else {
    data.losses++;
    data.consecutive_losses++;
    data.consecutive_wins = 0;
    
    if (profit < 0 && profit < data.worst_loss) {
      data.worst_loss = profit;
    }
    
    if (data.consecutive_losses > data.max_consecutive_losses) {
      data.max_consecutive_losses = data.consecutive_losses;
    }
  }

  // Calculate derived metrics
  data.success_rate = data.attempts > 0 ? (data.wins / data.attempts) * 100 : 0;
  data.avg_profit = data.wins > 0 ? data.total_profit / data.wins : 0;
  
  // Profit factor = total profits / total losses
  const totalLosses = Math.abs(data.worst_loss) * data.losses;
  data.profit_factor = totalLosses > 0 ? data.total_profit / totalLosses : data.total_profit > 0 ? 999 : 0;

  // Save to file
  saveMemory();
}

// Save memory to file
function saveMemory() {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (error) {
    console.error('Error saving memory file:', error.message);
  }
}

// Get token statistics
function getTokenStats(pair) {
  return memory[pair] || null;
}

// Get all token statistics
function getAllStats() {
  return { ...memory };
}

// Get top performing tokens
function getTopPerformers(limit = 10) {
  const pairs = Object.keys(memory);
  
  return pairs
    .map(pair => ({
      pair,
      ...memory[pair]
    }))
    .sort((a, b) => b.total_profit - a.total_profit)
    .slice(0, limit);
}

// Get worst performing tokens
function getWorstPerformers(limit = 10) {
  const pairs = Object.keys(memory);
  
  return pairs
    .map(pair => ({
      pair,
      ...memory[pair]
    }))
    .sort((a, b) => a.total_profit - b.total_profit)
    .slice(0, limit);
}

// Get tokens with highest success rate
function getHighestSuccessRate(limit = 10, minAttempts = 5) {
  const pairs = Object.keys(memory);
  
  return pairs
    .map(pair => ({
      pair,
      ...memory[pair]
    }))
    .filter(token => token.attempts >= minAttempts)
    .sort((a, b) => b.success_rate - a.success_rate)
    .slice(0, limit);
}

// Get tokens to avoid (high failure rate)
function getTokensToAvoid(minAttempts = 10, maxSuccessRate = 20) {
  const pairs = Object.keys(memory);
  
  return pairs
    .map(pair => ({
      pair,
      ...memory[pair]
    }))
    .filter(token => token.attempts >= minAttempts && token.success_rate <= maxSuccessRate)
    .sort((a, b) => a.success_rate - b.success_rate);
}

// Get summary statistics
function getSummaryStats() {
  const pairs = Object.keys(memory);
  
  if (pairs.length === 0) {
    return {
      total_pairs: 0,
      total_attempts: 0,
      total_wins: 0,
      total_losses: 0,
      total_profit: 0,
      overall_success_rate: 0,
      avg_profit_per_win: 0,
      best_performing_pair: null,
      worst_performing_pair: null
    };
  }

  let totalAttempts = 0;
  let totalWins = 0;
  let totalLosses = 0;
  let totalProfit = 0;
  let bestPair = null;
  let worstPair = null;
  let bestProfit = -Infinity;
  let worstProfit = Infinity;

  for (const pair of pairs) {
    const stats = memory[pair];
    totalAttempts += stats.attempts;
    totalWins += stats.wins;
    totalLosses += stats.losses;
    totalProfit += stats.total_profit;

    if (stats.total_profit > bestProfit) {
      bestProfit = stats.total_profit;
      bestPair = pair;
    }

    if (stats.total_profit < worstProfit) {
      worstProfit = stats.total_profit;
      worstPair = pair;
    }
  }

  return {
    total_pairs: pairs.length,
    total_attempts: totalAttempts,
    total_wins: totalWins,
    total_losses: totalLosses,
    total_profit: totalProfit,
    overall_success_rate: totalAttempts > 0 ? (totalWins / totalAttempts) * 100 : 0,
    avg_profit_per_win: totalWins > 0 ? totalProfit / totalWins : 0,
    best_performing_pair: bestPair,
    worst_performing_pair: worstPair,
    best_profit: bestProfit,
    worst_profit: worstProfit
  };
}

// Clear old data (older than specified days)
function clearOldData(daysOld = 30) {
  const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  const pairs = Object.keys(memory);
  let removedCount = 0;

  for (const pair of pairs) {
    if (memory[pair].last_seen < cutoffTime) {
      delete memory[pair];
      removedCount++;
    }
  }

  if (removedCount > 0) {
    saveMemory();
    console.log(`Cleared ${removedCount} old token records`);
  }

  return removedCount;
}

// Reset statistics for a specific pair
function resetPairStats(pair) {
  if (memory[pair]) {
    delete memory[pair];
    saveMemory();
    return true;
  }
  return false;
}

// Export memory data for backup
function exportMemory(filePath) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(memory, null, 2));
    return true;
  } catch (error) {
    console.error('Error exporting memory:', error.message);
    return false;
  }
}

// Import memory data from backup
function importMemory(filePath) {
  try {
    const importedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    memory = importedData;
    saveMemory();
    return true;
  } catch (error) {
    console.error('Error importing memory:', error.message);
    return false;
  }
}

module.exports = {
  updateTokenStats,
  getTokenStats,
  getAllStats,
  getTopPerformers,
  getWorstPerformers,
  getHighestSuccessRate,
  getTokensToAvoid,
  getSummaryStats,
  clearOldData,
  resetPairStats,
  exportMemory,
  importMemory
};