const Command = require('../../structures/Command');
const { MessageEmbed } = require("discord.js");

module.exports = class HelpCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'help',
            description: "Show the bot's help command",
            examples: ['help', 'help \`ping\`'],
            usages: ['help', 'help \`<command>\`'],
            cooldown: 3,
        })
    }
    async run(message, args, prefix) {
        if (!args[0]) {
            let module = [...this.client.helps.values()];
            const embed = new MessageEmbed()
            .setDescription(`This is a list of commands you can use. You can get more info about a specific command by using \`${prefix}help <command>\` (e.g. \`${prefix}help ping\`)`)
            .setTimestamp()
            .setColor('#2ecc70')
            .setFooter({ text: this.client.user.tag, iconURL: this.client.user.displayAvatarURL({ size: 1024 })})
            for (const mod of module) {
                embed.addField(`${mod.name} • ${mod.desc}`, mod.cmds.map(cmd => `\`${cmd.name}\``).join(', '))
            }
            return message.channel.send({ embeds: [embed] });
    
        } else {
            let query = args[0].toLowerCase();
            if (this.client.commands.has(query) || this.client.commands.get(this.client.aliases.get(query))) {
                let command = this.client.commands.get(query) || this.client.commands.get(this.client.aliases.get(query));
                let name = command.name;
                let desc = command.description;
                let cooldown = command.cooldown + " second(s)";
                let aliases = command.aliases.length ? command.conf.aliases.join(", ") : "No aliases was provided.";
                let usage = command.usages.length ? command.usages.join(", ") : "No usage was provided.";
                let example = command.examples.length ? command.examples.join(", ") : "No example was provided.";
                let userperms = command.userPermissions.length ? command.conf.userPermissions.map(x => `\`${x}\``).join(", ") : "No perms required.";
                let botperms = command.clientPermissions.length ? command.clientPermissions.map(x => `\`${x}\``).join(", ") : "No perms required.";
                let channelperms = command.channelPermissions.length ? command.channelPermissions.map(x => `\`${x}\``).join(", ") : "No perms required.";
    
                let embed = new MessageEmbed()
                    .setTitle(`${prefix}${name}`)
                    .setDescription(desc)
                    .setThumbnail(this.client.user.displayAvatarURL())
                    .setFooter({text: "[] are optional and <> are required. don't includes these things while typing a command"})
                    .addField("Cooldown", cooldown, true)
                    .addField("Aliases", aliases, true)
                    .addField("Usage", usage, true)
                    .addField("Example", example, true)
                    .setColor('#2ecc70')
                    .addField("User permission", userperms, true)
                    .addField("Global permission", botperms, true)
                    .addField(`Channel permission`, channelperms, true)
                return message.channel.send({ embeds: [embed] });
            } else {
                return message.channel.send(`That command doesn't exist.`);
            };
        };
    };
};