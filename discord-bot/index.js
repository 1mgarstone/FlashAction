
require('dotenv').config();
const DiscordTradingBot = require('./discordBot.js');

const bot = new DiscordTradingBot();
bot.start().catch(console.error);
