const Command = require('../../structures/Command');
const { canModifyQueue } = require("../../util/musicutil");
const { reactIfAble } = require("../../util/util");

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'disconnect',
            description: "disconnect me from voice channel",
            usages: ['disconnect'],
        })
    }
    async run(message) {
        const queue = this.client.queue.get(message.guild.id);
        if (queue) {
            if (queue.pending) return message.channel.send("Wait until fully connected to the voice channel to disconnect");
        };
        if (!message.guild.me.voice.channel) return message.channel.send("I am not connected to any voice channel!");
        if (queue && !canModifyQueue(message.member)) return message.channel.send(`Join ${queue.channel}`);
        this.client.lavacordManager.leave(message.guild.id);
        return reactIfAble(message, this.client.user, '👋');
    };
};
