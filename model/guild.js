const mongoose = require('mongoose');
const { prefix } = require('../config.json');

const reqString = {
    type: String,
    required: true,
};

const guildSchema = mongoose.Schema({
    guildID: reqString,
    prefix: {
        type: String,
        default: prefix
    },
    premium: Boolean,
    blacklist: Boolean,
    premiumEnded: Date,
    afkIgnoreChannel: String
});
module.exports = mongoose.model('bot-guilds', guildSchema, 'bot-guilds');