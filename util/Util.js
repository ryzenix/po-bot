module.exports = class Util {
    static async askString(channel, filter, { time = 20000 } = {}) {
        const verify = await channel.awaitMessages({
            filter: filter,
            max: 1,
            time
        });
        if (!verify.size) return 0;
        const choice = verify.first().content.toLowerCase();
        if (choice === 'cancel') return false;
        return verify.first();
    };
    static async deleteIfAble(message) {
        if (message.channel.permissionsFor(message.guild.me).has('MANAGE_MESSAGES')) {
            await message.delete();
        } else return null;
    };
    static async purgeDbGuild(client, id) {
        await client.dbguilds.findOneAndDelete({
            guildID: id
        });
        return true;
    };
    static sec(string) {
		const parts = string.split(':');
		let seconds = 0;
		let minutes = 1;
	
		while (parts.length > 0) {
			seconds += minutes * Number.parseInt(parts.pop(), 10);
			minutes *= 60;
		};
		return seconds;
	};
    static shortenText(text, maxLength) {
        let shorten = false;
        while (text.length > maxLength) {
            if (!shorten) shorten = true;
            text = text.substr(0, text.length - 1);
        }
        return shorten ? `${text}...` : text;
    };
    static async reactIfAble(message, user, emoji, fallbackEmoji) {
        const dm = !message.guild;
        if (fallbackEmoji && (!dm && !message.channel.permissionsFor(user).has('USE_EXTERNAL_EMOJIS'))) {
            emoji = fallbackEmoji;
        }
        if (dm || message.channel.permissionsFor(user).has(['ADD_REACTIONS', 'READ_MESSAGE_HISTORY'])) {
            try {
                await message.react(emoji);
            } catch {
                return null;
            }
        }
        return null;
    };
};