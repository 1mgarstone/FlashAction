
const OpenAI = require('openai');

class AITradingAssistant {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.isEnabled = !!process.env.OPENAI_API_KEY;
    this.context = {
      activeStrategies: [],
      marketConditions: {},
      profitHistory: [],
      riskProfile: 'moderate'
    };
  }

  async analyzeMarketConditions(marketData) {
    if (!this.isEnabled) return null;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert arbitrage trading AI assistant. Analyze market data and provide trading recommendations.
            Current context: ${JSON.stringify(this.context)}
            Focus on: Flash loan opportunities, DEX price differences, gas optimization, MEV protection.`
          },
          {
            role: "user", 
            content: `Analyze this market data and suggest optimal arbitrage opportunities: ${JSON.stringify(marketData)}`
          }
        ],
        max_tokens: 800
      });

      return {
        analysis: response.choices[0].message.content,
        timestamp: Date.now(),
        confidence: this.calculateConfidence(marketData)
      };
    } catch (error) {
      console.error('🤖 AI Analysis Error:', error);
      return null;
    }
  }

  async executeAICommand(command, context = {}) {
    if (!this.isEnabled) {
      return { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to secrets.' };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an AI trading assistant with command execution capabilities for a flash loan arbitrage system.
            
            Available commands:
            - start_trading: Begin autonomous trading
            - stop_trading: Halt all trading activities  
            - adjust_params: Modify trading parameters
            - scan_opportunities: Scan for arbitrage opportunities
            - execute_trade: Execute specific trade
            - optimize_strategy: Improve current strategy
            - risk_assessment: Evaluate current risk levels
            - emergency_stop: Emergency shutdown
            
            Respond ONLY with valid JSON format:
            {"action": "command_name", "parameters": {...}, "reasoning": "explanation", "priority": "high/medium/low"}`
          },
          {
            role: "user",
            content: `Command: ${command}\nContext: ${JSON.stringify(context)}\nCurrent System State: ${JSON.stringify(this.context)}`
          }
        ],
        max_tokens: 500
      });

      const aiResponse = JSON.parse(response.choices[0].message.content);
      return await this.processAICommand(aiResponse);
    } catch (error) {
      console.error('🤖 AI Command Error:', error);
      return { error: error.message, suggestion: 'Try rephrasing your command or check API connectivity' };
    }
  }

  async processAICommand(aiResponse) {
    const { action, parameters, reasoning, priority } = aiResponse;
    
    console.log(`🤖 AI Decision: ${action} (${priority} priority)`);
    console.log(`💭 Reasoning: ${reasoning}`);

    // Update context
    this.context.lastAIAction = {
      action,
      parameters,
      reasoning,
      timestamp: Date.now()
    };

    switch (action) {
      case 'start_trading':
        return await this.startAutonomousTrading(parameters);
      case 'stop_trading':
        return await this.stopTrading();
      case 'adjust_params':
        return await this.adjustTradingParams(parameters);
      case 'scan_opportunities':
        return await this.scanMarkets(parameters);
      case 'execute_trade':
        return await this.executeTrade(parameters);
      case 'optimize_strategy':
        return await this.optimizeStrategy(parameters);
      case 'risk_assessment':
        return await this.assessRisk();
      case 'emergency_stop':
        return await this.emergencyStop();
      default:
        return { 
          error: 'Unknown command', 
          suggestion: reasoning,
          availableCommands: ['start_trading', 'stop_trading', 'adjust_params', 'scan_opportunities', 'execute_trade', 'optimize_strategy', 'risk_assessment', 'emergency_stop']
        };
    }
  }

  async startAutonomousTrading(params) {
    console.log('🚀 AI Starting Autonomous Trading...');
    
    // Integration with existing trading engines
    const UltimateEngine = require('../trading/ultimateArbitrageEngine.js');
    const engine = new UltimateEngine();
    
    const result = await engine.startAIAutonomousMode(params);
    
    this.context.activeStrategies.push({
      type: 'autonomous',
      params,
      startTime: Date.now(),
      aiGenerated: true
    });

    return { 
      status: 'started', 
      message: 'AI-powered autonomous trading initiated',
      parameters: params,
      expectedProfit: this.calculateExpectedProfit(params),
      riskLevel: this.assessRiskLevel(params)
    };
  }

  async generateTradingStrategy(marketConditions) {
    if (!this.isEnabled) return null;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Generate optimized flash loan arbitrage strategies based on current market conditions.
            
            Consider:
            - Flash loan providers (Aave, Balancer, dYdX)
            - DEX pairs (Uniswap, SushiSwap, PancakeSwap)
            - Gas costs and slippage
            - MEV protection
            - Risk management
            
            Return detailed strategy with specific parameters.`
          },
          {
            role: "user",
            content: `Current market: ${JSON.stringify(marketConditions)}. Generate the best strategy for maximum profit with controlled risk.`
          }
        ],
        max_tokens: 1000
      });

      const strategy = response.choices[0].message.content;
      
      // Store strategy in context
      this.context.activeStrategies.push({
        type: 'ai_generated',
        strategy,
        timestamp: Date.now(),
        marketSnapshot: marketConditions
      });

      return {
        strategy,
        confidence: this.calculateStrategyConfidence(marketConditions),
        estimatedProfit: this.estimateStrategyProfit(strategy),
        riskScore: this.calculateRiskScore(strategy)
      };
    } catch (error) {
      console.error('🤖 Strategy Generation Error:', error);
      return null;
    }
  }

  async optimizeStrategy(params) {
    console.log('🧠 AI Optimizing Trading Strategy...');
    
    const currentPerformance = this.context.profitHistory.slice(-10);
    const optimizationSuggestions = await this.generateOptimizations(currentPerformance);
    
    return {
      status: 'optimized',
      suggestions: optimizationSuggestions,
      projectedImprovement: this.calculateProjectedImprovement(optimizationSuggestions)
    };
  }

  async assessRisk() {
    const riskFactors = {
      marketVolatility: this.calculateMarketVolatility(),
      liquidityRisk: this.assessLiquidityRisk(),
      gasRisk: this.assessGasRisk(),
      slippageRisk: this.assessSlippageRisk(),
      exposureRisk: this.calculateExposureRisk()
    };

    const overallRisk = this.calculateOverallRisk(riskFactors);
    
    return {
      riskLevel: overallRisk,
      factors: riskFactors,
      recommendations: this.generateRiskRecommendations(riskFactors),
      action: overallRisk > 0.7 ? 'reduce_exposure' : 'continue'
    };
  }

  calculateConfidence(marketData) {
    // Simple confidence calculation based on data completeness and consistency
    const factors = [
      marketData.priceData ? 0.3 : 0,
      marketData.liquidityData ? 0.3 : 0,
      marketData.volumeData ? 0.2 : 0,
      marketData.gasData ? 0.2 : 0
    ];
    return factors.reduce((sum, factor) => sum + factor, 0);
  }

  calculateExpectedProfit(params) {
    // Simplified profit calculation
    const baseProfit = params.amount * (params.priceDifference || 0.01);
    const gasCost = params.gasPrice * params.gasLimit;
    return baseProfit - gasCost;
  }

  assessRiskLevel(params) {
    const riskFactors = [
      params.amount > 100000 ? 0.3 : 0.1,
      params.slippage > 0.5 ? 0.2 : 0.05,
      params.gasPrice > 50 ? 0.15 : 0.05
    ];
    const totalRisk = riskFactors.reduce((sum, risk) => sum + risk, 0);
    
    if (totalRisk > 0.6) return 'high';
    if (totalRisk > 0.3) return 'medium';
    return 'low';
  }

  // Helper methods for risk assessment
  calculateMarketVolatility() { return Math.random() * 0.5; }
  assessLiquidityRisk() { return Math.random() * 0.3; }
  assessGasRisk() { return Math.random() * 0.4; }
  assessSlippageRisk() { return Math.random() * 0.3; }
  calculateExposureRisk() { return Math.random() * 0.2; }
  
  calculateOverallRisk(factors) {
    return Object.values(factors).reduce((sum, risk) => sum + risk, 0) / Object.keys(factors).length;
  }

  generateRiskRecommendations(factors) {
    const recommendations = [];
    if (factors.marketVolatility > 0.3) recommendations.push('Reduce position sizes due to high volatility');
    if (factors.gasRisk > 0.3) recommendations.push('Wait for lower gas prices');
    if (factors.liquidityRisk > 0.2) recommendations.push('Check liquidity depth before executing');
    return recommendations;
  }
}

module.exports = AITradingAssistant;
