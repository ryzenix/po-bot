const { Client, Collection } = require("discord.js");

module.exports = class Bot extends Client {
    constructor(options) {
        super(options);
        this.slashHelps = new Collection();
        this.commands = new Collection();
        this.slash = new Collection();
        this.helps = new Collection();
        this.aliases = new Collection();
        this.config = require('../config.json');
        this.dcTimeout = new Map();
        this.dbguilds = require('../model/guild');
        this.deletedChannels = new WeakSet();
        this.queue = new Map();
        this.timeoutPremium = new Collection();
    };
};