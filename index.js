process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

require('dotenv').config();


const winston = require('winston');

global.logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
    ],
    format: winston.format.printf(log => `[${log.level.toUpperCase()}] - ${log.message}`),
});
const { Intents, Options } = require('discord.js');
const Client = require('./structures/Client');
const mongo = require('./middleware/mongoLoad');

const intents = new Intents();

intents.add(
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MEMBERS,
    Intents.FLAGS.GUILD_INTEGRATIONS,
    Intents.FLAGS.GUILD_VOICE_STATES,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
);
const client = new Client({
    intents,
    makeCache: Options.cacheWithLimits({
        MessageManager: 180,
    }),
    allowedMentions: {
        parse: ['users', 'roles'],
        repliedUser: true
    },
});

client.on("warn", warn => logger.log('warn', warn));
client.on("error", err => logger.log('error', err));

require('./middleware/commandLoader')(client);
if (process.env.NO_WEB_SERVER !== 'true') require('./middleware/WebSocket').init(client);
require('./middleware/Event')(client);

(async() => {
    await mongo.init();
    client.login(client.config.token).catch(err => logger.log('error', err));
})();
