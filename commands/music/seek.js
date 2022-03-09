const Command = require('../../structures/Command');
const humanize = require('humanize-duration');
const timestring = require('timestring');
const { sec } = require('../../util/util');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'seek',
            description: "seek to a specific time in the song",
            usages: ["seek \`03:58\`", "seek \`1m 26s\`"],
        })
    }
    async run(message) {
        const queue = this.client.queue.get(message.guild.id);
        if (!queue) return message.channel.send(`No ongoing music queue`);
        if (!canModifyQueue(message.member)) return message.channel.send(`Join ${queue.channel} to do this command`);
        if (queue.pending) return message.channel.send(`Still connecting to your voice channel! Try again later`);
    
        const song = queue.nowPlaying;
        if (!song) return message.channel.send(`The song haven't played yet`);
        if (!song.info.isSeekable) return message.channel.send(`The song is not seekable`);
        const seek = queue.player.state.position;
        if (!seek) return message.channel.send(`The song haven't played yet`);
        if (song.requestedby.id !== message.author.id && !message.member.permissions.has('MANAGE_MESSAGES')) return message.channel.send(`You don't have the permission to do it since you didn't request the song, or you don't have \`MANAGE_MESSAGES\` to seek.`);
    
        const query = args.join(" ");
        if (!query) return message.channel.send(`Insert jump time. For example \`04:05\` or \`2m 6s\``);
        let time;
        try {
            time = timestring(query);
        } catch {
            time = sec(query);
        };
    
        const timeMs = time * 1000;
        if (timeMs > song.info.length - 5) return message.channel.send(`The specified time than the current playing song!`);
        queue.player.seek(timeMs);
        if (queue.textChannel.id !== message.channel.id && !this.client.deletedChannels.has(queue.textChannel)) queue.textChannel.send(`seeked to **${humanize(timeMs)}**`);
        if (this.client.deletedChannels.has(queue.textChannel)) queue.textChannel = message.channel;
        return message.channel.send(`Seeked to **${humanize(timeMs)}**`)
    };
};
