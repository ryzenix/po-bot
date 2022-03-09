const Command = require('../../structures/Command');
const { splitBar } = require("string-progressbar");
const { formatDuration } = require('../../util/musicutil');
const { MessageEmbed } = require('discord.js');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'now-playing',
            description: "Shows the current song that is playing",
            usages: ['now-playing'],
            aliases: ['np']
        })
    }
    async run(message) {
        const queue = this.client.queue.get(message.guild.id);
        if (!queue) return message.channel.send("No song is playing");
    
        if (queue.pending) return message.channel.send("Still connecting to your voice channel!");
        const song = queue.nowPlaying;
        if (!song) return message.channel.send("The song haven't played yet");
        const seek = queue.player.state.position || 0;
    
        const duration = song.info.isStream ? null : song.info.length;
        const cursor = '🔵';
        const fixedSeek = Math.floor(seek / 1000);
    
        const bar = splitBar(duration == 0 || !duration ? fixedSeek : duration / 1000, fixedSeek, 16, '▬', cursor)[0];
        const status = queue.playing ? '`▶`' : '`⏸`';
    
        let nowPlaying = new MessageEmbed()
        .setFooter({ text: `Requested by: ${song.requestedby.tag}`, iconURL: song.requestedby.displayAvatarURL() })
        .setTitle(`Now Playing: ${song.info.title} - ${song.info.author}`)
            .setURL(song.info.uri)
            .setDescription(`${status} ${bar} \`${formatDuration(seek)}/${!duration ? "LIVE" : formatDuration(duration)}\``)
        return message.channel.send({ embeds: [nowPlaying] });
    };
};
