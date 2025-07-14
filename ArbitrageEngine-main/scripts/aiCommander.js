
#!/usr/bin/env node

const AITradingAssistant = require('../services/aiService.js');
const readline = require('readline');

class AICommander {
  constructor() {
    this.ai = new AITradingAssistant();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('🤖 AI Trading Assistant Commander');
    console.log('Type "help" for available commands or start typing...\n');
  }

  async start() {
    if (!this.ai.isEnabled) {
      console.log('❌ OpenAI API key not found. Please add OPENAI_API_KEY to your environment variables.');
      console.log('💡 Use the Secrets tool in Replit to add your API key securely.');
      process.exit(1);
    }

    this.showPrompt();
  }

  showPrompt() {
    this.rl.question('🤖 AI Commander > ', async (input) => {
      await this.processCommand(input.trim());
      this.showPrompt();
    });
  }

  async processCommand(command) {
    if (command === 'exit' || command === 'quit') {
      console.log('👋 Goodbye!');
      process.exit(0);
    }

    if (command === 'help') {
      this.showHelp();
      return;
    }

    if (command === 'status') {
      console.log('📊 AI Status:', this.ai.context);
      return;
    }

    try {
      console.log('🔄 Processing command with AI...');
      const result = await this.ai.executeAICommand(command, {
        timestamp: Date.now(),
        source: 'cli'
      });

      console.log('🤖 AI Response:');
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  showHelp() {
    console.log(`
🤖 AI Trading Assistant Commands:

Direct Commands:
• start trading with 1000 USDC
• stop all trading activities  
• scan for arbitrage opportunities
• optimize current strategy
• assess current risk levels
• emergency stop everything

Utility Commands:
• status - Show AI context and state
• help - Show this help message
• exit/quit - Exit the commander

Examples:
• "Start autonomous trading with moderate risk and 5000 USDC"
• "Find the best arbitrage opportunity right now"
• "Stop trading if profit drops below 2%"
• "Optimize strategy for gas efficiency"

The AI will interpret your natural language and execute appropriate actions.
`);
  }
}

// Start the commander if run directly
if (require.main === module) {
  const commander = new AICommander();
  commander.start();
}

module.exports = AICommander;
