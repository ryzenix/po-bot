const Command = require("../../structures/Command");
const { MessageActionRow, MessageSelectMenu, MessageEmbed } = require('discord.js');
const { shortenText } = require('../../util/util');
const { fetchInfo, canModifyQueue } = require('../../util/musicutil');
const moment = require('moment');
require('moment-duration-format');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: "search",
            description: "search for a song then play it",
            usages: ["search <query>"],
        });
    }
    async run(message, args, prefix, cmd, bulkAdd) {
        if (!args.length) return message.channel.send(`You should use \`${prefix}search <title>\``);
        const { channel } = message.member.voice;
        if (!channel) return message.channel.send(`Not in a voice channel.`);
    
    
        const serverQueue = this.client.queue.get(message.guild.id);
        if (serverQueue && !canModifyQueue(message.member)) {
            const voicechannel = serverQueue.channel
            return message.reply(`Already been playing music in your server. Join ${voicechannel} to search.`);
        };
    
        const noPermission = channel.type === 'GUILD_VOICE' ? (!channel.joinable || !channel.speakable) : (!channel.joinable || !channel.manageable);
        if (noPermission) return message.reply(`Can't join or talk in the voice channel where you are in. can you check my permission?`);
    
        const search = args.join(" ");
        let result = [];
        let options = [];
        let lavalinkRes = []
        try {
            message.channel.sendTyping();
            let ytRes = await fetchInfo(this.client, search, null, 'yt');
            if (ytRes.length < 1) return message.channel.send("No match were found");
            ytRes
                .splice(0, 9)
                .forEach(song => {
                    song.requestedby = message.author;
                    lavalinkRes.push(song);
                    const duration = song.info.isStream ? ' [LIVE]' : ` | ${shortenText(moment.duration(song.info.length).format('H[h] m[m] s[s]'), 35)}`;
                    result.push({
                        title: shortenText(song.info.title, 90),
                        url: song.info.uri,
                        desc: shortenText(song.info.author, 45) + duration
                    });
                });
    
            result.forEach((song, index) => {
                options.push({
                    label: song.title,
                    description: song.desc,
                    value: index.toString()
                })
            });
            const menu = new MessageSelectMenu()
                .setCustomId('search')
                .setMaxValues(options.length)
                .setMinValues(1)
                .addOptions(options)
                .setPlaceholder('Choose a song to play');
            const row = new MessageActionRow()
                .addComponents(menu)
            const msg = await message.channel.send({
                content: 'Select all the song that you want to add in with the menu below! (multiple choices are supported)',
                components: [row],
            });
            const filter = async(res) => {
                if (res.user.id !== message.author.id) {
                    await res.reply({
                        content: 'select all the song that you want to add in with the menu below! (multiple choices are supported)',
                        ephemeral: true
                    });
                    return false;
                } else {
                    return true;
                };
            };
            let inactive = true;
            try {
                const response = await msg.awaitMessageComponent({
                    componentType: 'SELECT_MENU',
                    filter,
                    time: 15000,
                    max: 1
                });
                inactive = false;
                response.deferUpdate();
                if (msg.deletable) await msg.delete();
                if (response.values.length > 1) {
                    const bulk = response.values.map(song => lavalinkRes[song]);
                    this.client.commands
                        .get("playlist")
                        .run(message, args, prefix, cmd, bulk);
                } else {
                    const song = lavalinkRes[parseInt(response.values[0])];
                    this.client.commands
                        .get("play")
                        .run(message, args, prefix, cmd, song);
                };
            } catch {
                if (inactive) {
                    row.components.forEach(component => component.setDisabled(true));
                    msg.edit({
                        content: `This command is now inactive! Playing the first song...`,
                        components: [row]
                    });
                    const song = lavalinkRes[0];
                    this.client.commands
                        .get("play")
                        .run(message, args, prefix, cmd, song);
                };
            };
        } catch (error) {
            console.error(error);
            return message.reply('There was an error while processing your search! Try again later?').catch(err => logger.log('error', err));
        };
    }
};
