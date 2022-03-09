const Command = require('../../structures/Command');
const { MessageEmbed } = require("discord.js");

module.exports = class HelpCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'set-prefix',
            description: "Change server prefix",
            examples: ['set-prefix', 'set-prefix \`!\`'],
            usages: ['set-prefix', 'set-prefix \`<prefix>\`'],
            cooldown: 3,
        })
    }
    async run(message, args, prefix) {
        if (args.length < 1) {
            return message.channel.send(
                `The current current guild prefix here is \`${prefix}\` and you could use \`${prefix}set-prefix <prefix>\` to change the prefix`
            );
        }
        await client.dbguilds.findOneAndUpdate(
            {
                guildID: message.guild.id,
            },
            {
                prefix: args[0],
            }
        );
        return message.channel.send(`The current guild prefix has been updated to \`${args[0]}\``);
    };
};