const Command = require('../../structures/Command');
const { canModifyQueue } = require("../../util/musicutil");
const { reactIfAble } = require("../../util/util");

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'stop',
            description: "stop the whole queue",
            usages: ['stop'],
        })
    }
    async run(message) {
        const queue = this.client.queue.get(message.guild.id);
        if (!queue) return message.channel.send("No song left in queue");
        if (!canModifyQueue(message.member)) return message.channel.send(`You need to be in ${queue.channel} to do this command.`);
        if (queue.pending) return message.channel.send("Still connecting to your voice channel!");
        queue.nowPlaying = undefined;
        queue.songs = [];
        queue.stop('selfStop');
        return reactIfAble(message, this.client.user, '👌')
    };
};
