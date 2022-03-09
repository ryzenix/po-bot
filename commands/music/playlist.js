const Command = require("../../structures/Command");
const Queue = require("../../features/music/play");
const {
    fetchInfo,
    canModifyQueue,
    YOUTUBE_API_KEY,
    DEFAULT_VOLUME,
} = require("../../util/musicutil");
const YouTubeAPI = require("simple-youtube-api");
const scdl = require("soundcloud-downloader").default;
const youtube = new YouTubeAPI(YOUTUBE_API_KEY);
const { getTracks } = require("spotify-url-info");

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: "playlist",
            description: "Play songs from a playlist",
            usages: ["playlist <url>", "playlist <query>"],
        });
    }
    async run(message, args, prefix, cmd, bulkAdd) {
        const { channel } = message.member.voice;

        if (!channel)
            return message.channel.send("You are not in a voice channel!");
        const serverQueue = this.client.queue.get(message.guild.id);

        if (serverQueue && !canModifyQueue(message.member)) {
            const voicechannel = serverQueue.channel;
            return message.reply(
                `Already been playing music in your server. Join ${voicechannel} to search.`
            );
        }

        const noPermission =
            channel.type === "GUILD_VOICE"
                ? !channel.joinable && !channel.speakable
                : !channel.joinable && !channel.manageable;
        if (noPermission)
            return message.reply(`Can't join or talk in the voice channel where you are in. can you check my permission?`);

        if (!args.length)
            return message.channel.send(
                `You should use \`${prefix}playlist <title>\``
            );

        const search = args.join(" ");

        const pattern = /^.*(youtu.be\/|list=)([^#\&\?]*).*/gi;
        const spotifyRegex =
            /^(?:spotify:|(?:https?:\/\/(?:open|play)\.spotify\.com\/))(?:embed)?\/?(album|track|playlist|episode|show)(?::|\/)((?:[0-9a-zA-Z]){22})/;
        const mobileScRegex = /^https?:\/\/(soundcloud\.app\.goo\.gl)\/(.*)$/;

        let url = args[0];
        const urlValid = pattern.test(url);

        const queueConstruct = new Queue(
            message.guild,
            this.client,
            message.channel,
            channel
        );
        const init = await queueConstruct.init();
        if (!init)
            return message.reply(
                "There was an error. Please try again later or contact the developer."
            );

        queueConstruct.volume = DEFAULT_VOLUME;

        let newSongs;
        let playlistURL;
        if (bulkAdd) {
            newSongs = bulkAdd;
        } else if (urlValid) {
            try {
                newSongs = await fetchInfo(this.client, url, null);
                if (!newSongs || !newSongs.length)
                    return message.channel.send('No match were found');
                playlistURL = url;
                newSongs.forEach((song) => {
                    song.type = "yt";
                    song.requestedby = message.author;
                });
            } catch (error) {
                return message.channel.send("No match were found");
            }
        } else if (scdl.isValidUrl(url) || mobileScRegex.test(url)) {
            try {
                newSongs = await fetchInfo(this.client, url, null, "yt");
                if (!newSongs || !newSongs.length) return message.channel.send("No match were found");
                playlistURL = url;
                newSongs.forEach((song) => {
                    song.type = "sc";
                    song.requestedby = message.author;
                });
            } catch (error) {
                return message.channel.send("No match were found");
            }
        } else if (url.match(spotifyRegex)) {
            const fields = url.match(spotifyRegex);
            if (fields[1] === "episode" || fields[1] === "show") {
                return message.channel.send("No support for podcast link from Spotify yet.");
            }
            try {
                newSongs = [];
                if (fields[1] === "playlist" || fields[1] === "album") {
                    const playlist = await getTracks(url);
                    if (!playlist || !playlist.length) return message.channel.send("No match were found");
                    for (const data of playlist) {
                        const song = {
                            info: {
                                uri: data.external_urls.spotify,
                                title: data.name,
                                author: data.artists
                                    .map((x) => x.name)
                                    .join(", "),
                                length: data.duration_ms,
                                isStream: false,
                                isSeekable: false,
                            },
                            type: "sp",
                            requestedby: message.author,
                        };
                        newSongs.push(song);
                    }
                    if (!newSongs.length) return message.channel.send("No match were found");
                    playlistURL = url;
                    newSongs.forEach((song) => {
                        song.requestedby = message.author;
                    });
                }
            } catch (error) {
                return message.channel.send("No match were found");
            }
        } else {
            try {
                const results = await youtube.searchPlaylists(search, 10, {
                    part: "snippet",
                });
                if (!results.length) return message.channel.send("No match were found");
                const playlist = results[0];
                newSongs = await fetchInfo(
                    this.client,
                    `https://www.youtube.com/playlist?list=${playlist.id}`
                );
                if (!newSongs || !newSongs.length)
                    return message.channel.send("Failed when fetching the information from YouTube");
                playlistURL = `https://www.youtube.com/playlist?list=${playlist.id}`;
                newSongs.forEach((song) => {
                    song.type = "yt";
                    song.requestedby = message.author;
                });
            } catch (error) {
                logger.log("error", error);
                return message.channel.send("Failed when fetching the information from YouTube");
            }
        }
        serverQueue
            ? serverQueue.songs.push(...newSongs)
            : queueConstruct.songs.push(...newSongs);
        if (
            serverQueue &&
            message.channel.id !== serverQueue.textChannel.id &&
            !this.client.deletedChannels.has(serverQueue.textChannel)
        ) {
            serverQueue.textChannel.send(`✅ Added **${newSongs.length}** ${
                newSongs.length > 1
                    ? `tracks`
                    : `track`
            } to the queue [${message.author}]`);
        }
        if (serverQueue && this.client.deletedChannels.has(serverQueue.textChannel))
            serverQueue.textChannel = message.channel;
        message.channel.send(`✅ Added **${newSongs.length}** ${
            newSongs.length > 1
                ? `tracks`
                : `track`
        } to the queue [${message.author}]`);
        if (!serverQueue) {
            this.client.queue.set(message.guild.id, queueConstruct);
            try {
                queueConstruct.play(queueConstruct.songs[0]);
            } catch (error) {
                logger.log("error", error);
                this.client.queue.delete(message.guild.id);
                return message.channel
                    .send(`There was an error. Please try again later or contact the developer.`)
                    .catch((err) => logger.log("error", err));
            }
        }
    }
};
