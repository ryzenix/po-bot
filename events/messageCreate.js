const { Collection, MessageEmbed } = require("discord.js");
const ms = require('ms');
const cooldowns = new Collection();

module.exports = async(client, message) => {
        if (!client.finished) return;
        if (message.author.bot) return;

        let prefix;
        let setting;

        if (message.channel.type === "DM") {
            prefix = client.config.prefix
        } else {
            setting = await client.dbguilds.findOne({
                guildID: message.guild.id
            });
            if (!setting) {
                const dbguilds = client.dbguilds;
                setting = new dbguilds({
                    guildID: message.guild.id
                });
                await setting.save();
                prefix = setting.prefix;
            } else {
                prefix = setting.prefix;
            }
            if (!message.channel.permissionsFor(message.guild.me).has('SEND_MESSAGES')) return;
        };
        const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);


        if (!prefixRegex.test(message.content)) return;
        const [, matchedPrefix] = message.content.match(prefixRegex);

        let execute = message.content.slice(matchedPrefix.length).trim();
        if (!execute) {
            const prefixMention = new RegExp(`^<@!?${client.user.id}>( |)$`);
            if (prefixMention.test(matchedPrefix)) {
                return message.channel.send(`you just summon me! to use some command, either ping me or use \`${prefix}\` as a prefix! to get help, use \`${prefix}help\`! cya!`).then(m => {
                    setTimeout(() => {
                        m.delete()
                    }, 5000);
                });
            } else {
                return;
            };
        };
        let args = execute.split(/ +/g);
        let cmd = args.shift().toLowerCase();
        let sender = message.author;

        message.flags = []
        while (args[0] && args[0][0] === "-") {
            message.flags.push(args.shift().slice(1));
        };


        let commandFile = client.commands.get(cmd) || client.commands.get(client.aliases.get(cmd));
        if (!commandFile) return;


        if (client.config.owner !== message.author.id && commandFile.ownerOnly) return;
        if (!client.config.admins.includes(message.author.id) && commandFile.adminOnly) return;

        if (message.channel.type === "DM" && commandFile.guildOnly) return;


        if (commandFile.userPermissions && message.channel.type !== "DM" && commandFile.userPermissions.length) {
            if (!message.member.permissions.has(commandFile.userPermissions)) {
                return message.channel.send(`You don't have ${commandFile.userPermissions.map(x => `\`${x}\``).join(" and ")} permission`);
        };
    };
    if (commandFile.channelPermissions && message.channel.type !== 'DM' && commandFile.channelPermissions.length) {
        if (!message.channel.permissionsFor(message.guild.me).has(commandFile.channelPermissions)) {
            return message.channel.send(`I don't have the ${commandFile.channelPermissions.map(x => `\`${x}\``).join(" and ")} permission in this channel`);
        };
    }
    if (commandFile.clientPermissions && message.channel.type !== "DM" && commandFile.clientPermissions.length) {
        if (!message.guild.me.permissions.has(commandFile.clientPermissions)) {
            return message.channel.send(`I don't have the ${commandFile.clientPermissions.map(x => `\`${x}\``).join(" and ")} permission across the server to do that`)
        };
    };
    if (!cooldowns.has(commandFile.name)) cooldowns.set(commandFile.name, new Collection());

    const cooldownID = message.channel.type === "DM" ? message.author.id : message.author.id + message.guild.id;

    const now = Date.now();
    const timestamps = cooldowns.get(commandFile.name);
    const cooldownAmount = (commandFile.cooldown || 3) * 1000;

    if (!timestamps.has(cooldownID)) {
        if (!client.config.admins.includes(message.author.id)) {

            timestamps.set(cooldownID, now);
        }
    } else {
        const expirationTime = timestamps.get(cooldownID) + cooldownAmount;

        if (now < expirationTime) {
            return message.reply({ content: `Wait **${timeLeft.toFixed(1)}** seconds before continuing? (cooldown)`})
        };
        timestamps.set(cooldownID, now);
        setTimeout(() => timestamps.delete(cooldownID), cooldownAmount);
    };

    try {
        commandFile.run(message, args, prefix, cmd);
        logger.log('info', `${sender.tag} (${sender.id}) from ${message.channel.type === 'DM' ? 'DM' : `${message.guild.name} (${message.guild.id})`} ran a command: ${prefix}${cmd}`);
    } catch (error) {
        message.channel.send(`Fot an error while executing that command for you. Please ask for support`)
        logger.log('error', error);
    };
};