
require('dotenv').config();
const TelegramTradingBot = require('./telegramBot.js');

const bot = new TelegramTradingBot();
bot.start();
