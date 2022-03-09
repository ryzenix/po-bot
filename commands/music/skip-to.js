const Command = require('../../structures/Command');
const { canModifyQueue } = require('../../util/musicutil');
const { MessageCollector } = require('discord.js');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'skip-to',
            description: "skips to a certain song",
            usages: ['skip-to <song index>'],
        })
    }
    async run(message) {
        if (!args.length || isNaN(args[0])) return message.channel.send(`Insert the index of the song that you wanted to skip. (for example ${prefix}skip-to 5)`);
        const queue = this.client.queue.get(message.guild.id);
        if (!queue) return message.channel.send("there isn't any ongoing music queue");
        if (!canModifyQueue(message.member)) return message.channel.send(`Join ${queue.channel} to do this command`);
        if (!queue.songs.length) return message.channel.send(`No song left in the queue`);

        if (queue.pending) return message.channel.send("Still connecting to your voice channel!");
        if (!queue.nowPlaying) return message.channel.send("Still connecting to your voice channel!");

        if (args[0] > queue.songs.length) return message.channel.send(`Invalid queue position! Only **${queue.songs.length}** songs in the queue.`);
        queue.playing = true;
        if (queue.loop) {
            for (let i = 0; i < args[0] - 1; i++) {
                queue.songs.push(queue.songs.shift());
            }
        } else {
            queue.songs = queue.songs.slice(args[0] - 1);
        };
        if (queue.repeat) queue.nowPlaying = undefined;
        queue.skip();
        const number = args[0] - 1;
        if (queue.textChannel.id !== message.channel.id && !client.deletedChannels.has(queue.textChannel)) queue.textChannel.send(`${message.author} skipped ${number} songs ⏭`);
        if (this.client.deletedChannels.has(queue.textChannel)) queue.textChannel = message.channel;

        message.channel.send(`You skipped ${number} songs! ⏭`)
    };
};
