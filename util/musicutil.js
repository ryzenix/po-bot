const { youtubekey, soundcloudkey } = require('../config.json');
const request = require('node-superfetch');

exports.canModifyQueue = (member) => {
    const { channelId } = member.voice;
    const botChannel = member.guild.me.voice.channelId;
    if (channelId !== botChannel) {
        return;
    };
    return true;
};

exports.fetchInfo = async(client, query, search, id) => {
    const nodes = client.lavacordManager.idealNodes;
    const node = id ? nodes.filter(x => x.id !== id)[0] : nodes[0];
    const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g);
    const searchType = search || 'ytsearch';

    const { body } = await request
        .get(`http://${node.host || 'lava.link'}:${node.port || '80'}/loadtracks`)
        .set({ Authorization: node.password || 'anything' })
        .query({
            identifier: urlRegex.test(query) ? query : `${searchType}:${query}`,
        });
    return body.tracks;
};

exports.formatDuration = (milliseconds) => {
    if (milliseconds > 3600000000) return 'Live';
    if (milliseconds === 0) return "00:00";

    const times = {
        years: 0,
        months: 0,
        weeks: 0,
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    };

    while (milliseconds > 0) {
        if (milliseconds - 31557600000 >= 0) {
            milliseconds -= 31557600000;
            times.years++;
        } else if (milliseconds - 2628000000 >= 0) {
            milliseconds -= 2628000000;
            times.months++;
        } else if (milliseconds - 604800000 >= 0) {
            milliseconds -= 604800000;
            times.weeks += 7;
        } else if (milliseconds - 86400000 >= 0) {
            milliseconds -= 86400000;
            times.days++;
        } else if (milliseconds - 3600000 >= 0) {
            milliseconds -= 3600000;
            times.hours++;
        } else if (milliseconds - 60000 >= 0) {
            milliseconds -= 60000;
            times.minutes++;
        } else {
            times.seconds = Math.round(milliseconds / 1000);
            milliseconds = 0;
        }
    }

    let finalTime = [];
    let first = false;

    for (const [k, v] of Object.entries(times)) {
        if (v === 0 && !first) continue;
        finalTime.push(v < 10 ? `0${v}` : `${v}`);
        first = true;
        continue;
        if (v > 0) finalTime.push(`${v} ${v > 1 ? k : k.slice(0, -1)}`);
    }

    if (finalTime.length === 1) finalTime.unshift("00");

    let time = finalTime.join(":");

    if (time.includes(",")) {
        const pos = time.lastIndexOf(",");
        time = `${time.slice(0, pos)} and ${time.slice(pos + 1)}`;
    }

    return time;
};

exports.YOUTUBE_API_KEY = youtubekey;
exports.SOUNDCLOUD_CLIENT_ID = soundcloudkey;
exports.MAX_PLAYLIST_SIZE = "100"
exports.PRUNING = false;
exports.STAY_TIME = "600";
exports.DEFAULT_VOLUME = "100";