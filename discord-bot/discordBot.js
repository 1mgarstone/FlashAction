
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const TradingAgent = require('../agent/agent.js');

class DiscordTradingBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
    
    this.tradingAgent = new TradingAgent();
    this.setupCommands();
    this.setupEventHandlers();
  }

  setupCommands() {
    this.commands = [
      new SlashCommandBuilder()
        .setName('status')
        .setDescription('Get trading agent status'),
      
      new SlashCommandBuilder()
        .setName('opportunities')
        .setDescription('View current arbitrage opportunities'),
      
      new SlashCommandBuilder()
        .setName('portfolio')
        .setDescription('View portfolio and P&L'),
      
      new SlashCommandBuilder()
        .setName('execute')
        .setDescription('Execute arbitrage trade')
        .addStringOption(option =>
          option.setName('strategy')
            .setDescription('Trading strategy')
            .setRequired(true)
            .addChoices(
              { name: 'Flash Loan', value: 'flashloan' },
              { name: 'Ultimate', value: 'ultimate' },
              { name: 'Multi-Chain', value: 'multichain' }
            ))
        .addNumberOption(option =>
          option.setName('amount')
            .setDescription('Trade amount in USD')
            .setRequired(true)),
      
      new SlashCommandBuilder()
        .setName('start')
        .setDescription('Start the trading agent'),
      
      new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the trading agent')
    ];
  }

  setupEventHandlers() {
    this.client.on('ready', () => {
      console.log(`🤖 Discord Trading Bot logged in as ${this.client.user.tag}`);
      this.registerSlashCommands();
      this.startPeriodicUpdates();
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      }
    });
  }

  async registerSlashCommands() {
    try {
      await this.client.application.commands.set(this.commands);
      console.log('✅ Discord slash commands registered');
    } catch (error) {
      console.error('❌ Failed to register commands:', error);
    }
  }

  async handleSlashCommand(interaction) {
    const { commandName, options } = interaction;

    try {
      switch (commandName) {
        case 'status':
          await this.handleStatusCommand(interaction);
          break;
        case 'opportunities':
          await this.handleOpportunitiesCommand(interaction);
          break;
        case 'portfolio':
          await this.handlePortfolioCommand(interaction);
          break;
        case 'execute':
          await this.handleExecuteCommand(interaction, options);
          break;
        case 'start':
          await this.handleStartCommand(interaction);
          break;
        case 'stop':
          await this.handleStopCommand(interaction);
          break;
      }
    } catch (error) {
      await interaction.reply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  }

  async handleStatusCommand(interaction) {
    const status = await this.tradingAgent.getAgentStatus();
    
    const embed = new EmbedBuilder()
      .setTitle('🤖 Trading Agent Status')
      .setColor(status.isRunning ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: 'Status', value: status.isRunning ? '🟢 Active' : '🔴 Stopped', inline: true },
        { name: 'Uptime', value: `${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m`, inline: true },
        { name: 'Components', value: Object.entries(status.components)
          .map(([key, value]) => `${value ? '✅' : '❌'} ${key}`)
          .join('\n'), inline: false }
      )
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('refresh_status')
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(status.isRunning ? 'stop_agent' : 'start_agent')
          .setLabel(status.isRunning ? '⏹️ Stop' : '▶️ Start')
          .setStyle(status.isRunning ? ButtonStyle.Danger : ButtonStyle.Success)
      );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }

  async handleOpportunitiesCommand(interaction) {
    await interaction.deferReply();
    
    const opportunities = await this.tradingAgent.scanOpportunities();
    
    if (opportunities.length === 0) {
      await interaction.editReply('📊 No profitable opportunities found at the moment.');
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle('💰 Arbitrage Opportunities')
      .setColor(0x00ff00)
      .setDescription(`Found ${opportunities.length} profitable opportunities`)
      .setTimestamp();

    opportunities.slice(0, 5).forEach((opp, index) => {
      embed.addFields({
        name: `${index + 1}. ${opp.pairs.join('/')}`,
        value: `**Profit:** $${opp.profit.toFixed(2)} (${(opp.profitability * 100).toFixed(2)}%)\n**Strategy:** ${opp.strategy}\n**Risk:** ${(opp.risk * 100).toFixed(1)}%`,
        inline: true
      });
    });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('auto_execute_best')
          .setLabel('🚀 Execute Best')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('refresh_opportunities')
          .setLabel('🔄 Refresh')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.editReply({
      embeds: [embed],
      components: [row]
    });
  }

  async handlePortfolioCommand(interaction) {
    await interaction.deferReply();
    
    const portfolio = await this.tradingAgent.getPortfolioStatus();
    
    const embed = new EmbedBuilder()
      .setTitle('📈 Portfolio Status')
      .setColor(portfolio.pnl >= 0 ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: 'Total Value', value: `$${portfolio.totalValue.toFixed(2)}`, inline: true },
        { name: 'P&L', value: `${portfolio.pnl >= 0 ? '+' : ''}$${portfolio.pnl.toFixed(2)}`, inline: true },
        { name: 'Success Rate', value: `${(portfolio.performance.successRate * 100).toFixed(1)}%`, inline: true },
        { name: 'Total Trades', value: portfolio.performance.totalTrades.toString(), inline: true },
        { name: 'Avg Profit', value: `$${portfolio.performance.avgProfit.toFixed(2)}`, inline: true },
        { name: 'Recent Trades', value: portfolio.trades.slice(0, 3)
          .map(trade => `${trade.profit >= 0 ? '✅' : '❌'} $${trade.profit.toFixed(2)}`)
          .join('\n') || 'No recent trades', inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  async handleExecuteCommand(interaction, options) {
    const strategy = options.getString('strategy');
    const amount = options.getNumber('amount');
    
    await interaction.deferReply();
    
    const result = await this.tradingAgent.executeTrade(strategy, amount, []);
    
    const embed = new EmbedBuilder()
      .setTitle(result.success ? '✅ Trade Executed' : '❌ Trade Failed')
      .setColor(result.success ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: 'Strategy', value: strategy, inline: true },
        { name: 'Amount', value: `$${amount}`, inline: true },
        { name: 'Result', value: result.success ? `Profit: $${result.profit}` : result.error, inline: false }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  }

  async handleStartCommand(interaction) {
    await interaction.deferReply();
    
    try {
      await this.tradingAgent.startAgent();
      await interaction.editReply('✅ Trading agent started successfully!');
    } catch (error) {
      await interaction.editReply(`❌ Failed to start agent: ${error.message}`);
    }
  }

  async handleStopCommand(interaction) {
    await interaction.deferReply();
    
    try {
      await this.tradingAgent.stopAgent();
      await interaction.editReply('⏹️ Trading agent stopped successfully!');
    } catch (error) {
      await interaction.editReply(`❌ Failed to stop agent: ${error.message}`);
    }
  }

  async handleButtonInteraction(interaction) {
    const { customId } = interaction;
    
    switch (customId) {
      case 'refresh_status':
        await this.handleStatusCommand(interaction);
        break;
      case 'start_agent':
        await this.handleStartCommand(interaction);
        break;
      case 'stop_agent':
        await this.handleStopCommand(interaction);
        break;
      case 'refresh_opportunities':
        await this.handleOpportunitiesCommand(interaction);
        break;
      case 'auto_execute_best':
        await this.executeBestOpportunity(interaction);
        break;
    }
  }

  async executeBestOpportunity(interaction) {
    await interaction.deferUpdate();
    
    const opportunities = await this.tradingAgent.scanOpportunities();
    if (opportunities.length > 0) {
      const best = opportunities[0];
      const result = await this.tradingAgent.autoExecuteOpportunity(best);
      
      const embed = new EmbedBuilder()
        .setTitle(result.success ? '🚀 Auto-Execution Successful' : '❌ Auto-Execution Failed')
        .setColor(result.success ? 0x00ff00 : 0xff0000)
        .setDescription(result.success ? `Executed ${best.strategy} for $${result.profit} profit` : result.error)
        .setTimestamp();
      
      await interaction.followUp({ embeds: [embed] });
    }
  }

  startPeriodicUpdates() {
    // Send periodic updates to a designated channel
    setInterval(async () => {
      const opportunities = await this.tradingAgent.scanOpportunities();
      if (opportunities.length > 0) {
        // Send to configured channel
        const channel = this.client.channels.cache.get(process.env.DISCORD_CHANNEL_ID);
        if (channel) {
          const embed = new EmbedBuilder()
            .setTitle('🔔 New Opportunities Detected')
            .setDescription(`Found ${opportunities.length} new arbitrage opportunities`)
            .setColor(0x00ff00)
            .setTimestamp();
          
          await channel.send({ embeds: [embed] });
        }
      }
    }, 60000); // Check every minute
  }

  async start() {
    await this.client.login(process.env.DISCORD_BOT_TOKEN);
  }
}

module.exports = DiscordTradingBot;
