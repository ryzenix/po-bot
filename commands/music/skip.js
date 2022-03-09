const Command = require('../../structures/Command');
const { canModifyQueue } = require('../../util/musicutil');
const { reactIfAble } = require("../../util/util");
const { MessageCollector } = require('discord.js');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'skip',
            description: "skip the current song",
            usages: ['skip'],
        })
    }
    async run(message) {
        const queue = this.client.queue.get(message.guild.id);
        if (!queue) return message.channel.send("There isn't any ongoing music queue");
        if (!canModifyQueue(message.member)) return message.channel.send(`You have to be in ${queue.channel} to do this command`);
        if (queue.pending) return message.channel.send("Still connecting to your voice channel!");
        if (!queue.nowPlaying) return message.channel.send("Still connecting to your voice channel!");

        queue.playing = true;
        if (queue.repeat) queue.nowPlaying = undefined;
        queue.skip();
        reactIfAble(message, this.client.user, '👌');
        if (this.client.deletedChannels.has(queue.textChannel)) queue.textChannel = message.channel;
    };
};
