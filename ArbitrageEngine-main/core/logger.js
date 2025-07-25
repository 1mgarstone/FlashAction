// Enhanced Logger - Logs predictions & learning memory updates
const fs = require('fs');
const path = require('path');

class EnhancedLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
    
    this.logFiles = {
      info: path.join(this.logDir, 'info.log'),
      error: path.join(this.logDir, 'error.log'),
      trade: path.join(this.logDir, 'trades.log'),
      prediction: path.join(this.logDir, 'predictions.log'),
      memory: path.join(this.logDir, 'memory.log'),
      system: path.join(this.logDir, 'system.log')
    };

    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.maxLogSize = 10 * 1024 * 1024; // 10MB
    this.maxLogFiles = 5;
  }

  // Ensure log directory exists
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Format log message
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const pid = process.pid;
    
    let formattedMessage = `[${timestamp}] [${pid}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      formattedMessage += ` | Data: ${JSON.stringify(data)}`;
    }
    
    return formattedMessage + '\n';
  }

  // Write to log file with rotation
  async writeToFile(filePath, message) {
    try {
      // Check file size and rotate if necessary
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        if (stats.size > this.maxLogSize) {
          await this.rotateLogFile(filePath);
        }
      }

      // Append to log file
      fs.appendFileSync(filePath, message);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }

  // Rotate log file
  async rotateLogFile(filePath) {
    try {
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const basename = path.basename(filePath, ext);

      // Shift existing rotated files
      for (let i = this.maxLogFiles - 1; i > 0; i--) {
        const oldFile = path.join(dir, `${basename}.${i}${ext}`);
        const newFile = path.join(dir, `${basename}.${i + 1}${ext}`);
        
        if (fs.existsSync(oldFile)) {
          if (i === this.maxLogFiles - 1) {
            fs.unlinkSync(oldFile); // Delete oldest file
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Move current file to .1
      const rotatedFile = path.join(dir, `${basename}.1${ext}`);
      fs.renameSync(filePath, rotatedFile);
    } catch (error) {
      console.error('Failed to rotate log file:', error.message);
    }
  }

  // Log info message
  logInfo(message, data = null) {
    const formattedMessage = this.formatMessage('info', message, data);
    
    // Console output
    console.log(`ℹ️  ${message}`, data ? data : '');
    
    // File output
    this.writeToFile(this.logFiles.info, formattedMessage);
  }

  // Log error message
  logError(message, data = null) {
    const formattedMessage = this.formatMessage('error', message, data);
    
    // Console output
    console.error(`❌ ${message}`, data ? data : '');
    
    // File output
    this.writeToFile(this.logFiles.error, formattedMessage);
  }

  // Log trade execution
  logTrade(tradeData) {
    const message = `Trade executed: ${tradeData.pair} | Profit: ${tradeData.profit} | Status: ${tradeData.status}`;
    const formattedMessage = this.formatMessage('trade', message, tradeData);
    
    // Console output
    console.log(`💰 ${message}`);
    
    // File output
    this.writeToFile(this.logFiles.trade, formattedMessage);
  }

  // Log prediction (private - not shown in console)
  logPrediction(predictionData) {
    const message = `Prediction: ${predictionData.pair} | Spread: ${predictionData.currentSpread}% | Required: ${predictionData.requiredSpread}%`;
    const formattedMessage = this.formatMessage('prediction', message, predictionData);
    
    // Only file output (private)
    this.writeToFile(this.logFiles.prediction, formattedMessage);
  }

  // Log memory updates
  logMemoryUpdate(memoryData) {
    const message = `Memory update: ${memoryData.pair} | Success: ${memoryData.success} | Total attempts: ${memoryData.attempts}`;
    const formattedMessage = this.formatMessage('memory', message, memoryData);
    
    // File output only
    this.writeToFile(this.logFiles.memory, formattedMessage);
  }

  // Log system events
  logSystem(message, data = null) {
    const formattedMessage = this.formatMessage('system', message, data);
    
    // Console output
    console.log(`🔧 ${message}`, data ? data : '');
    
    // File output
    this.writeToFile(this.logFiles.system, formattedMessage);
  }

  // Log warning
  logWarning(message, data = null) {
    const formattedMessage = this.formatMessage('warning', message, data);
    
    // Console output
    console.warn(`⚠️  ${message}`, data ? data : '');
    
    // File output
    this.writeToFile(this.logFiles.info, formattedMessage);
  }

  // Log debug (only if debug level enabled)
  logDebug(message, data = null) {
    if (this.logLevel === 'debug') {
      const formattedMessage = this.formatMessage('debug', message, data);
      
      // Console output
      console.debug(`🐛 ${message}`, data ? data : '');
      
      // File output
      this.writeToFile(this.logFiles.info, formattedMessage);
    }
  }

  // Log arbitrage opportunity
  logOpportunity(opportunityData) {
    const message = `Opportunity found: ${opportunityData.pair} | Spread: ${opportunityData.spread}% | Profit: ${opportunityData.estimatedProfit}`;
    const formattedMessage = this.formatMessage('opportunity', message, opportunityData);
    
    // Console output
    console.log(`🎯 ${message}`);
    
    // File output
    this.writeToFile(this.logFiles.trade, formattedMessage);
  }

  // Log gas price changes
  logGasPrice(gasPriceData) {
    const message = `Gas price: ${gasPriceData.current} gwei | Change: ${gasPriceData.change}%`;
    const formattedMessage = this.formatMessage('gas', message, gasPriceData);
    
    // Console output if significant change
    if (Math.abs(gasPriceData.change) > 10) {
      console.log(`⛽ ${message}`);
    }
    
    // File output
    this.writeToFile(this.logFiles.system, formattedMessage);
  }

  // Get log statistics
  getLogStats() {
    const stats = {};
    
    for (const [type, filePath] of Object.entries(this.logFiles)) {
      try {
        if (fs.existsSync(filePath)) {
          const fileStats = fs.statSync(filePath);
          stats[type] = {
            size: fileStats.size,
            sizeFormatted: this.formatBytes(fileStats.size),
            modified: fileStats.mtime,
            lines: this.countLines(filePath)
          };
        } else {
          stats[type] = { size: 0, sizeFormatted: '0 B', lines: 0 };
        }
      } catch (error) {
        stats[type] = { error: error.message };
      }
    }
    
    return stats;
  }

  // Count lines in file
  countLines(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.split('\n').length - 1;
    } catch (error) {
      return 0;
    }
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Clear all logs
  clearLogs() {
    for (const filePath of Object.values(this.logFiles)) {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.error(`Failed to clear log ${filePath}:`, error.message);
      }
    }
    
    this.logSystem('All logs cleared');
  }

  // Export logs to archive
  exportLogs(archivePath) {
    try {
      const archiveDir = path.dirname(archivePath);
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      // Create archive with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalArchivePath = archivePath.replace('.zip', `_${timestamp}.zip`);

      // Simple copy for now (in production, would use proper archiving)
      const archiveData = {
        timestamp: new Date().toISOString(),
        logs: {}
      };

      for (const [type, filePath] of Object.entries(this.logFiles)) {
        if (fs.existsSync(filePath)) {
          archiveData.logs[type] = fs.readFileSync(filePath, 'utf8');
        }
      }

      fs.writeFileSync(finalArchivePath.replace('.zip', '.json'), JSON.stringify(archiveData, null, 2));
      
      this.logSystem(`Logs exported to ${finalArchivePath}`);
      return finalArchivePath;
    } catch (error) {
      this.logError('Failed to export logs:', error.message);
      throw error;
    }
  }

  // Tail log file (get last N lines)
  tailLog(logType, lines = 100) {
    const filePath = this.logFiles[logType];
    
    if (!filePath || !fs.existsSync(filePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      
      return allLines.slice(-lines);
    } catch (error) {
      this.logError('Failed to tail log:', error.message);
      return [];
    }
  }

  // Search logs
  searchLogs(query, logType = 'info', maxResults = 100) {
    const filePath = this.logFiles[logType];
    
    if (!filePath || !fs.existsSync(filePath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      const results = lines
        .filter(line => line.toLowerCase().includes(query.toLowerCase()))
        .slice(0, maxResults);
      
      return results;
    } catch (error) {
      this.logError('Failed to search logs:', error.message);
      return [];
    }
  }
}

// Create singleton instance
const logger = new EnhancedLogger();

// Export functions for backward compatibility
function logInfo(message, data) {
  logger.logInfo(message, data);
}

function logError(message, data) {
  logger.logError(message, data);
}

function logTrade(tradeData) {
  logger.logTrade(tradeData);
}

function logPrediction(predictionData) {
  logger.logPrediction(predictionData);
}

function logMemoryUpdate(memoryData) {
  logger.logMemoryUpdate(memoryData);
}

function logSystem(message, data) {
  logger.logSystem(message, data);
}

module.exports = {
  EnhancedLogger,
  logger,
  logInfo,
  logError,
  logTrade,
  logPrediction,
  logMemoryUpdate,
  logSystem
};