const Command = require('../../structures/Command');
const Genius = require("genius-lyrics");
const lyricsFinder = require("lyrics-finder");
const gclient = new Genius.Client(process.env.geniusKey);
const { MessageEmbed, Util } = require("discord.js");
const { shortenText } = require('../../util/util');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'lyrics',
            description: "Show lyrics of a song",
            usages: ['lyrics', 'lyrics <query>'],
        })
    }
    async run(message, args, prefix) {
        async function getLyrics(song) {
            try {
                const searches = await gclient.songs.search(song);
                const firstSong = searches[0];
                const lyrics = await firstSong.lyrics();
                return {
                    googleFetch: false,
                    lyrics,
                    title: firstSong.title,
                    thumbnail: firstSong.image,
                    author: firstSong.artist.name
                };
            } catch {
                try {
                    const lyrics = await lyricsFinder(song);
                    if (!lyrics) return { notFound: true };
                    return {
                        googleFetch: true,
                        lyrics
                    }
                } catch {
                    return { notFound: true }
                }
            }
        };
        let lyrics;
        let embed = new MessageEmbed()
            .setColor(message.member.displayHexColor)
        const queue = this.client.queue.get(message.guild.id);
        const query = args.join(" ");
        if (query) {
            const body = await getLyrics(query);
            if (body.notFound) return message.reply(`no lyrics was found for that song :pensive:`);
            if (!body.googleFetch) {
                embed.setTitle(`Lyrics for ${body.title} by ${body.author}`);
                embed.setThumbnail(body.thumbnail);
            } else {
                embed.setTitle(`Lyrics for ${query}`);
            };
            lyrics = body.lyrics;
        } else if (queue && queue.nowPlaying) {
            const body = await getLyrics(`${queue.nowPlaying.info.title} ${queue.nowPlaying.info.author}`);
            if (body.notFound) return message.reply(`i found no lyrics for the current playing song :pensive:`);
            if (!body.googleFetch) {
                embed.setTitle(`Lyrics for ${body.title} by ${body.author}`);
                embed.setThumbnail(body.thumbnail);
            } else {
                embed.setTitle(`Lyrics for ${queue.nowPlaying.info.title}`);
            };
            lyrics = body.lyrics;
        } else {
            return message.reply(`You should use ${prefix}lyrics <query>`);
        };
    
        const [first, ...rest] = Util.splitMessage(shortenText(lyrics, 12000), { maxLength: 3900, char: '' });
    
        if (rest.length) {
            embed.setDescription(first)
            await message.channel.send({ embeds: [embed] });
            const lastContent = rest.pop();
            if (rest.length) {
                for (const text of rest) {
                    const embed1 = new MessageEmbed()
                        .setColor(message.member.displayHexColor)
                        .setDescription(text)
                    await message.channel.send({ embeds: [embed1] })
                };
            }
            const embed3 = new MessageEmbed()
                .setColor(message.member.displayHexColor)
                .setDescription(lastContent)
                .setFooter({text: message.member.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                .setTimestamp()
            return message.channel.send({ embeds: [embed3] });
        } else {
            embed
                .setTimestamp()
                .setFooter({text: message.member.displayName, iconURL: message.author.displayAvatarURL({ dynamic: true })})
                .setColor(message.member.displayHexColor)
                .setDescription(first)
            return message.channel.send({ embeds: [embed] });
        };
    };
};
