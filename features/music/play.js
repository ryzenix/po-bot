const { MessageEmbed, Permissions } = require('discord.js');
const { fetchInfo, STAY_TIME } = require('../../util/musicutil');
const spotifyToYT = require("spotify-to-yt");

module.exports = class Queue {
    constructor(guild, client, textChannel, voiceChannel) {
        this.playingMessage = null;
        this.textChannel = textChannel;
        this.channel = voiceChannel;
        this.player = null;
        this.pending = true;
        this.guildId = guild.id;
        this.guild = guild;
        this.me = null;
        this.client = client;
        this.songs = [];
        this.loop = false;
        this.repeat = false;
        this.playing = true;
        this.nowPlaying = null;
        this.volume = null;
    };
    async init() {
        try {
            this.me = await this.guild.members.fetch(this.client.user);
            return this.me;
        } catch {
            return null;
        }
    }
    async stop(reason) {
        if (reason === 'noSong' || reason === 'selfStop') {
            if (this.client.dcTimeout.has(this.guildId)) {
                const timeout = this.client.dcTimeout.get(this.guildId);
                clearTimeout(timeout);
                this.client.dcTimeout.delete(this.guildId);
            };
            const timeout = setTimeout(async() => {
                if (!this.me.voice.channelId) return;
                const newQueue = this.client.queue.get(this.guildId);
                if (newQueue) return;
                await this.client.lavacordManager.leave(this.guildId);
                if (!this.client.deletedChannels.has(this.textChannel)) this.textChannel.send("i'm leaving the voice channel...");
            }, STAY_TIME * 1000);
            this.client.dcTimeout.set(this.guildId, timeout);
        };
        this.client.queue.delete(this.guildId);
        if (this.player) {
            if (reason === 'errorNode') {
                if (this.channel.permissionsFor(this.me).has(Permissions.FLAGS.MOVE_MEMBERS)) this.me.voice.disconnect();
                this.client.lavacordManager.players.delete(this.guildId);
            } else if (reason === 'destroyOnly') {
                this.player.destroy();
            } else if (reason !== 'disconnected') {
                this.player.stop();
            };
            this.player.removeListener('end', this.endEvent);
            this.player.removeListener('start', this.startEvent);
        };
    };
    pause() {
        this.playing = false;
        this.player.pause(true);
    }
    skip() {
        let upcoming;
        if (this.loop) {
            this.songs.push(this.nowPlaying);
            upcoming = this.songs[0];
        } else if (this.repeat) {
            upcoming = !this.nowPlaying ? this.songs[0] : this.nowPlaying;
        } else {
            upcoming = this.songs[0];
        };
        this.play(upcoming, false);
    };
    async initVc(node, voiceState) {
        if (!this.pending) this.pending = true;
        let targetNode;
        if (node) {
            targetNode = node.id;
        } else {
            targetNode = this.client.lavacordManager.idealNodes[0].id;
        }
        if (this.player) {
            this.player.removeListener('end', this.endEvent);
            this.player.removeListener('start', this.startEvent);
            this.player.removeListener('pause', this.pauseEvent);
        }
        this.player = await this.client.lavacordManager.join({
            guild: this.guildId,
            channel: this.channel.id,
            node: targetNode
        }, {
            selfdeaf: true
        });
        if (voiceState) await this.player.connect(voiceState);
        this.player.on('start', this.startEvent);
        this.player.on('end', this.endEvent);
        this.pending = false;

        return true;
    }
    async play(song, noSkip) {
        if (this.client.dcTimeout.has(this.guildId)) {
            const timeout = this.client.dcTimeout.get(this.guildId);
            clearTimeout(timeout);
            this.client.dcTimeout.delete(this.guildId);
        };
        if (!song) {
            return this.stop('noSong');
        };
        if (!this.player || !this.player.state.connected) {
            await this.initVc();
        };
        if (this.channel.type === 'GUILD_STAGE_VOICE' && this.me.voice.suppress) {
            if (!this.me.permissions.has(Permissions.STAGE_MODERATOR)) {
                this.me.voice.setRequestToSpeak(true);
                if (!this.client.deletedChannels.has(this.textChannel)) this.textChannel.send("since i'm not a speaker, i can't play your song publicly ;-; you can invite me to speak using **Right Click** -> **Invite to Speak** or accept my speak request!");
            } else {
                await this.me.voice.setSuppressed(false);
            };
        };
        if (song.type === 'sp') {
            try {
                let msg;
                const ytUrl = await spotifyToYT.trackGet(song.info.uri);
                if (msg) msg.delete();
                if (!ytUrl || !ytUrl.url) {
                    this.songs.shift();
                    if (!this.client.deletedChannels.has(this.textChannel)) await this.textChannel.send("Spotify has rejected the request :pensive: skipping to the next song...")
                    return this.play(this.songs[0]);
                };
                const [res] = await fetchInfo(this.client, ytUrl.url, null);
                if (!res) {
                    this.songs.shift();
                    if (!this.client.deletedChannels.has(this.textChannel)) await this.textChannel.send("Spotify has rejected the request :pensive: skipping to the next song...")
                    return this.play(this.songs[0]);
                };
                song.track = res.track;
            } catch (error) {
                this.songs.shift();
                if (!this.client.deletedChannels.has(this.textChannel)) await this.textChannel.send("Spotify has rejected the request :pensive: skipping to the next song...")
                return this.play(this.songs[0]);
            };
        };
        this.nowPlaying = song;
        try {
            if (!this.repeat) this.songs.splice(0, 1);
            this.player.play(song.track, {
                volume: this.volume || 100,
                noReplace: noSkip
            });
        } catch (error) {
            console.error(error);
            this.client.lavacordManager.leave(this.guild.id);
            if (!this.client.deletedChannels.has(this.textChannel)) return this.textChannel.send({ embeds: [{ description: `there was an error while playing the music! i had left the voice channel :pensive:` }] });
        };
    };
    startEvent = async(data) => this.start(data);
    endEvent = async(data) => this.end(data);
    async start(data) {
        try {
            const embed = new MessageEmbed()
            .setDescription(`Now playing **${this.nowPlaying.info.title}** by **${this.nowPlaying.info.author}**`)
            .setFooter({ text: `Requested by: ${this.nowPlaying.tag}`, iconURL: this.nowPlaying.displayAvatarURL() });

            if (!this.client.deletedChannels.has(this.textChannel)) {
                const sent = await this.textChannel.send({ embeds: [embed] });
                this.playingMessage = sent.id;
            };
        } catch (error) {
            console.error(error);
        };
    };
    async end(data) {
        if (this.debug && !this.client.deletedChannels.has(this.textChannel)) this.textChannel.send({ embeds: [{ description: `[DEBUG]: recieved \`STOP\` event with type \`${data.reason}\`!` }] })
        if (this.playingMessage && !this.client.deletedChannels.has(this.textChannel) && (data.reason === "FINISHED" || data.reason === 'REPLACED')) {
            if (this.songs.length) {
                await this.textChannel.messages.delete(this.playingMessage)
                .catch(() => {
                    logger.error(`Unable to delete playing message with ID: ${this.playingMessage}`);
                });
                this.playingMessage = null;
            } else if (this.repeat || this.loop) {
                await this.textChannel.messages.delete(this.playingMessage).catch(() => {
                    logger.error(`Unable to delete this playing message with ID: ${this.playingMessage}`);
                });
                this.playingMessage = null;
            };
        };
        if (data.reason === 'REPLACED' || data.reason === "STOPPED") return;
        if (data.reason === "FINISHED" || data.reason === "LOAD_FAILED") {
            let upcoming;
            if (this.loop && data.reason !== 'LOAD_FAILED') {
                this.songs.push(this.nowPlaying);
                upcoming = this.songs[0];
            } else if (this.repeat && data.reason !== 'LOAD_FAILED') {
                upcoming = !this.nowPlaying ? this.songs[0] : this.nowPlaying;
            } else {
                upcoming = this.songs[0];
            };
            this.play(upcoming);
            if (data.reason === 'LOAD_FAILED' && !this.client.deletedChannels.has(this.textChannel)) this.textChannel.send({ embeds: [{ color: "RED", description: `sorry, i can't seem to be able to load that song! skipping to the next one for you now...` }] });
        };
    };
};