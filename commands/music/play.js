const Command = require('../../structures/Command');
const Queue = require("../../features/music/play");
const { fetchInfo, canModifyQueue, DEFAULT_VOLUME } = require('../../util/musicutil');
const scdl = require("soundcloud-downloader").default;
const { getTracks } = require('spotify-url-info');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'play',
            description: "Play music",
            usages: ['play <url>', 'play <query>'],
            aliases: ['p']
        })
    }
    async run(message, args, prefix, cmd, bulkAdd) {
        const { channel } = message.member.voice;
        if (!channel) return message.channel.send('Not in a voice channel!');
        const serverQueue = this.client.queue.get(message.guild.id);
        if (serverQueue && !canModifyQueue(message.member)) {
            const voicechannel = serverQueue.channel
            return message.reply(`Already been playing music in your server. Join ${voicechannel} to listen.`);
        };
        const noPermission = channel.type === 'GUILD_VOICE' ? (!channel.joinable && !channel.speakable) : (!channel.joinable && !channel.manageable);
        if (noPermission) return message.reply(`Can't join or talk in the voice channel where you are in. can you check my permission?`);
    
        if (!args.length) return message.reply(`You should use \`${prefix}play <title>\``);

        const videoPattern = /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi;
        const playlistPattern = /^.*(list=)([^#\&\?]*).*/gi;
        const scRegex = /^https?:\/\/(soundcloud\.com)\/(.*)$/;
        const spotifyRegex = /^(?:spotify:|(?:https?:\/\/(?:open|play)\.spotify\.com\/))(?:embed)?\/?(album|track|playlist|episode|show)(?::|\/)((?:[0-9a-zA-Z]){22})/;
        const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;

        let url = args[0];

        const urlValid = videoPattern.test(url);

        if (!videoPattern.test(url) && playlistPattern.test(url)) {
            return this.client.commands.get("playlist").run(message, [url]);
        } else if (scdl.isValidUrl(url) && url.includes("/sets/")) {
            return this.client.commands.get("playlist").run(message, [url]);
        } else if (url.match(spotifyRegex)) {
            const match = url.match(spotifyRegex);
            const albumOrTrack = match[1];
            if (albumOrTrack === 'album' || albumOrTrack === 'playlist') return this.client.commands.get("playlist").run(message, [url]);
        };

        const queueConstruct = new Queue(message.guild, this.client, message.channel, channel);
        const init = await queueConstruct.init();
        if (!init) return message.reply(
            "There was an error. Please try again later or contact the developer."
        );
        queueConstruct.volume = DEFAULT_VOLUME;
        let song = null;
        if (bulkAdd) {
            song = bulkAdd;
        } else if (urlValid) {
            try {
                [song] = await fetchInfo(this.client, url, null);
                if (!song) return message.channel.send('No match were found');
                song.type = 'yt';
                song.requestedby = message.author;
            } catch (error) {
                logger.log('error', error);
                return message.channel.send(':x: no match were found');
            };
        } else if (scRegex.test(url) || mobileScRegex.test(url)) {
            try {
                const res = await fetchInfo(this.client, url, null, 'yt');
                if (res.length > 1) {
                    res.forEach(each => {
                        each.type = 'sc';
                        each.requestedby = message.author;
                    });
                    return this.client.commands
                        .get("playlist")
                        .run(message, args, prefix, cmd, res);
                } else {
                    song = res[0];
                    if (!song) return message.channel.send('No match were found');
                    song.type = 'sc';
                    song.requestedby = message.author;
                };
            } catch (error) {
                return message.channel.send('No match were found');
            };
        } else if (url.match(spotifyRegex)) {
            const matchs = url.match(spotifyRegex);
            if (matchs[1] === 'episode' || matchs[1] === 'show') {
                return message.channel.send('No match were found');
            };
            try {
                const results = await getTracks(url);
                if (!results || !results.length) return message.channel.send('No match were found');
                const info = results[0];
                song = {
                    info: {
                        uri: info.external_urls.spotify,
                        title: info.name,
                        author: info.artists.map(x => x.name).join(", "),
                        length: info.duration_ms,
                        isStream: false,
                        isSeekable: false
                    },
                    type: 'sp',
                    requestedby: message.author
                };
            } catch (error) {
                logger.log('error', error);
                return message.channel.send('No match were found');
            };
        } else {
            return this.client.commands
                .get("search")
                .run(message, args, prefix, cmd);
        };
        if (serverQueue) {
            serverQueue.songs.push(song);
            if (message.channel.id !== serverQueue.textChannel.id && !client.deletedChannels.has(serverQueue.textChannel)) serverQueue.textChannel.send(`✅ Added **${song.info.title}** by **${song.info.author}** to the queue [${song.requestedby}]`);
            if (client.deletedChannels.has(serverQueue.textChannel)) serverQueue.textChannel = message.channel;
            return message.channel.send(`✅ Added **${song.info.title}** by **${song.info.author}** to the queue [${song.requestedby}]`)
        };
        queueConstruct.songs.push(song);
        this.client.queue.set(message.guild.id, queueConstruct);
        try {
            queueConstruct.play(queueConstruct.songs[0]);
        } catch (error) {
            logger.log('error', error);
            this.client.queue.delete(message.guild.id);
            return message.channel.send(`There was an error. Please try again later or contact the developer.`)
        };

    };
};
