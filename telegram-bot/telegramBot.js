
const TelegramBot = require('node-telegram-bot-api');
const TradingAgent = require('../agent/agent.js');

class TelegramTradingBot {
  constructor() {
    this.bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    this.tradingAgent = new TradingAgent();
    this.userSessions = new Map();
    this.setupCommands();
    this.setupEventHandlers();
  }

  setupCommands() {
    this.bot.setMyCommands([
      { command: 'start', description: 'Start the bot' },
      { command: 'status', description: 'Get trading agent status' },
      { command: 'opportunities', description: 'View arbitrage opportunities' },
      { command: 'portfolio', description: 'View portfolio and P&L' },
      { command: 'execute', description: 'Execute a trade' },
      { command: 'startagent', description: 'Start trading agent' },
      { command: 'stopagent', description: 'Stop trading agent' },
      { command: 'settings', description: 'Bot settings' }
    ]);
  }

  setupEventHandlers() {
    this.bot.on('message', (msg) => {
      console.log(`Message from ${msg.from.username}: ${msg.text}`);
    });

    this.bot.onText(/\/start/, (msg) => {
      this.handleStartCommand(msg);
    });

    this.bot.onText(/\/status/, async (msg) => {
      await this.handleStatusCommand(msg);
    });

    this.bot.onText(/\/opportunities/, async (msg) => {
      await this.handleOpportunitiesCommand(msg);
    });

    this.bot.onText(/\/portfolio/, async (msg) => {
      await this.handlePortfolioCommand(msg);
    });

    this.bot.onText(/\/execute/, (msg) => {
      this.handleExecuteCommand(msg);
    });

    this.bot.onText(/\/startagent/, async (msg) => {
      await this.handleStartAgentCommand(msg);
    });

    this.bot.onText(/\/stopagent/, async (msg) => {
      await this.handleStopAgentCommand(msg);
    });

    this.bot.onText(/\/settings/, (msg) => {
      this.handleSettingsCommand(msg);
    });

    this.bot.on('callback_query', async (callbackQuery) => {
      await this.handleCallbackQuery(callbackQuery);
    });
  }

  async handleStartCommand(msg) {
    const chatId = msg.chat.id;
    const welcomeMessage = `
🤖 *Welcome to Arbitrage Trading Bot*

I can help you manage your arbitrage trading operations:

📊 /status - Check agent status
💰 /opportunities - View arbitrage opportunities  
📈 /portfolio - View your portfolio
🚀 /execute - Execute trades
▶️ /startagent - Start trading agent
⏹️ /stopagent - Stop trading agent
⚙️ /settings - Configure bot

Let's start making some profit! 💵
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📊 Status', callback_data: 'status' },
          { text: '💰 Opportunities', callback_data: 'opportunities' }
        ],
        [
          { text: '📈 Portfolio', callback_data: 'portfolio' },
          { text: '🚀 Execute Trade', callback_data: 'execute' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  async handleStatusCommand(msg) {
    const chatId = msg.chat.id;
    
    try {
      const status = await this.tradingAgent.getAgentStatus();
      
      const statusText = `
🤖 *Trading Agent Status*

Status: ${status.isRunning ? '🟢 Active' : '🔴 Stopped'}
Uptime: ${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m

*Components:*
${Object.entries(status.components)
  .map(([key, value]) => `${value ? '✅' : '❌'} ${key}`)
  .join('\n')}

Last updated: ${new Date().toLocaleTimeString()}
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 Refresh', callback_data: 'refresh_status' },
            { text: status.isRunning ? '⏹️ Stop' : '▶️ Start', callback_data: status.isRunning ? 'stop_agent' : 'start_agent' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, statusText, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error getting status: ${error.message}`);
    }
  }

  async handleOpportunitiesCommand(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '🔍 Scanning for opportunities...');
      
      const opportunities = await this.tradingAgent.scanOpportunities();
      
      if (opportunities.length === 0) {
        await this.bot.sendMessage(chatId, '📊 No profitable opportunities found at the moment.');
        return;
      }

      let message = `💰 *Arbitrage Opportunities* (${opportunities.length} found)\n\n`;
      
      opportunities.slice(0, 5).forEach((opp, index) => {
        message += `*${index + 1}. ${opp.pairs.join('/')}*\n`;
        message += `💵 Profit: $${opp.profit.toFixed(2)} (${(opp.profitability * 100).toFixed(2)}%)\n`;
        message += `📈 Strategy: ${opp.strategy}\n`;
        message += `⚠️ Risk: ${(opp.risk * 100).toFixed(1)}%\n\n`;
      });

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🚀 Execute Best', callback_data: 'execute_best' },
            { text: '🔄 Refresh', callback_data: 'refresh_opportunities' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error scanning opportunities: ${error.message}`);
    }
  }

  async handlePortfolioCommand(msg) {
    const chatId = msg.chat.id;
    
    try {
      const portfolio = await this.tradingAgent.getPortfolioStatus();
      
      const portfolioText = `
📈 *Portfolio Status*

💰 Total Value: $${portfolio.totalValue.toFixed(2)}
📊 P&L: ${portfolio.pnl >= 0 ? '+' : ''}$${portfolio.pnl.toFixed(2)}
🎯 Success Rate: ${(portfolio.performance.successRate * 100).toFixed(1)}%
📋 Total Trades: ${portfolio.performance.totalTrades}
💵 Avg Profit: $${portfolio.performance.avgProfit.toFixed(2)}

*Recent Trades:*
${portfolio.trades.slice(0, 5).map(trade => 
  `${trade.profit >= 0 ? '✅' : '❌'} $${trade.profit.toFixed(2)} - ${new Date(trade.timestamp).toLocaleString()}`
).join('\n') || 'No recent trades'}
      `;

      await this.bot.sendMessage(chatId, portfolioText, {
        parse_mode: 'Markdown'
      });
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error getting portfolio: ${error.message}`);
    }
  }

  handleExecuteCommand(msg) {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '⚡ Flash Loan', callback_data: 'execute_flashloan' },
          { text: '🎯 Ultimate', callback_data: 'execute_ultimate' }
        ],
        [
          { text: '🔗 Multi-Chain', callback_data: 'execute_multichain' },
          { text: '❌ Cancel', callback_data: 'cancel' }
        ]
      ]
    };

    this.bot.sendMessage(chatId, '🚀 *Select Trading Strategy:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  async handleStartAgentCommand(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '🚀 Starting trading agent...');
      await this.tradingAgent.startAgent();
      await this.bot.sendMessage(chatId, '✅ Trading agent started successfully!');
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Failed to start agent: ${error.message}`);
    }
  }

  async handleStopAgentCommand(msg) {
    const chatId = msg.chat.id;
    
    try {
      await this.bot.sendMessage(chatId, '⏹️ Stopping trading agent...');
      await this.tradingAgent.stopAgent();
      await this.bot.sendMessage(chatId, '⏹️ Trading agent stopped successfully!');
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Failed to stop agent: ${error.message}`);
    }
  }

  handleSettingsCommand(msg) {
    const chatId = msg.chat.id;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔔 Notifications', callback_data: 'settings_notifications' },
          { text: '💰 Trade Limits', callback_data: 'settings_limits' }
        ],
        [
          { text: '⚠️ Risk Settings', callback_data: 'settings_risk' },
          { text: '🎯 Strategies', callback_data: 'settings_strategies' }
        ]
      ]
    };

    this.bot.sendMessage(chatId, '⚙️ *Bot Settings:*', {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    await this.bot.answerCallbackQuery(callbackQuery.id);
    
    switch (data) {
      case 'status':
        await this.handleStatusCommand({ chat: { id: chatId } });
        break;
      case 'opportunities':
        await this.handleOpportunitiesCommand({ chat: { id: chatId } });
        break;
      case 'portfolio':
        await this.handlePortfolioCommand({ chat: { id: chatId } });
        break;
      case 'execute':
        this.handleExecuteCommand({ chat: { id: chatId } });
        break;
      case 'refresh_status':
        await this.handleStatusCommand({ chat: { id: chatId } });
        break;
      case 'refresh_opportunities':
        await this.handleOpportunitiesCommand({ chat: { id: chatId } });
        break;
      case 'execute_best':
        await this.executeBestOpportunity(chatId);
        break;
      case 'start_agent':
        await this.handleStartAgentCommand({ chat: { id: chatId } });
        break;
      case 'stop_agent':
        await this.handleStopAgentCommand({ chat: { id: chatId } });
        break;
      default:
        if (data.startsWith('execute_')) {
          const strategy = data.replace('execute_', '');
          await this.promptForTradeAmount(chatId, strategy);
        }
    }
  }

  async executeBestOpportunity(chatId) {
    try {
      await this.bot.sendMessage(chatId, '🚀 Executing best opportunity...');
      
      const opportunities = await this.tradingAgent.scanOpportunities();
      if (opportunities.length > 0) {
        const best = opportunities[0];
        const result = await this.tradingAgent.autoExecuteOpportunity(best);
        
        const message = result.success 
          ? `✅ *Trade Successful!*\n💰 Profit: $${result.profit}\n📈 Strategy: ${best.strategy}`
          : `❌ *Trade Failed*\n${result.error}`;
        
        await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      } else {
        await this.bot.sendMessage(chatId, '❌ No opportunities available');
      }
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Execution failed: ${error.message}`);
    }
  }

  async promptForTradeAmount(chatId, strategy) {
    this.userSessions.set(chatId, { awaitingAmount: true, strategy });
    
    await this.bot.sendMessage(chatId, 
      `💰 Enter trade amount in USD for *${strategy}* strategy:`,
      { parse_mode: 'Markdown' }
    );
  }

  startPeriodicUpdates() {
    setInterval(async () => {
      const opportunities = await this.tradingAgent.scanOpportunities();
      if (opportunities.length > 0) {
        // Send to subscribed users
        const message = `🔔 *New Opportunities!*\nFound ${opportunities.length} profitable arbitrage opportunities`;
        
        // You would maintain a list of subscribed chat IDs
        const subscribedUsers = []; // Load from database
        subscribedUsers.forEach(chatId => {
          this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        });
      }
    }, 60000);
  }

  start() {
    console.log('🤖 Telegram Trading Bot started');
    this.startPeriodicUpdates();
  }
}

module.exports = TelegramTradingBot;
