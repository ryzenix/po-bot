const Command = require("../../structures/Command");
const { formatDuration } = require('../../util/musicutil')

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: "queue",
            description: "Display the queue",
            usages: ["playlist <url>", "playlist <query>"],
        });
    }
    async run(message, args, prefix) {
        const queue = this.client.queue.get(message.guild.id);
        if (!queue) return message.channel.send("No song is playing");
    
        if (queue.pending) return message.channel.send("Still connecting to your voice channel!");

        let queueFields = [];
        const nowPlaying = queue.nowPlaying;

        if (!nowPlaying) return message.channel.send("Still connecting to your voice channel!");

        queueFields.push(
            `**Now playing**: **[${nowPlaying.info.title}](${nowPlaying.info.uri}) - ${
                nowPlaying.info.author
            }** [${nowPlaying.requestedby}] (${formatDuration(
                nowPlaying.info.length
            )})`
        );
        queue.songs.forEach((track, index) => {
            queueFields.push(
                `\`${index + 1}\` - [${track.info.title}](${track.info.uri}) - ${
                    track.info.author
                } [${track.requestedby}] (${formatDuration(track.info.length)})`
            );
        });
        const pages = [];
        while (queueFields.length) {
            const toAdd = queueFields.splice(
                0,
                guilds.length >= 10 ? 10 : guilds.length
            );
            pages.push(toAdd);
        }
        const embedPages = [];
        pages.forEach((item, index) => {
            const embed = new MessageEmbed()
                .setTitle(
                    `Music queue in ${message.guild.name}:`
                )
                .setDescription(item.join("\n"));
            embedPages.push(embed);
        });

        const button1 = new MessageButton()
            .setCustomId("previousbtn")
            .setLabel("Previous")
            .setStyle("DANGER");

        const button2 = new MessageButton()
            .setCustomId("nextbtn")
            .setLabel("Next");
        const row = new MessageActionRow().addComponents([button1, button2]);
        const msg = await message.channel.send({
            components: [row],
            embeds: [embedPages[0]],
        });
        const filter = async (res) => {
            if (res.user.id !== message.author.id) {
                await res.reply({
                    embeds: [
                        {
                            description: `those buttons are for ${message.author.toString()} :pensive:`,
                        },
                    ],
                    ephemeral: true,
                });
                return false;
            } else {
                await res.deferUpdate();
                return true;
            }
        };
        let currentPage = 0;
        const collector = msg.createMessageComponentCollector({
            componentType: "BUTTON",
            filter,
            time: 60000,
        });
        collector.on("end", async () => {
            row.components.forEach((button) => button.setDisabled(true));
            if (msg.editable)
                return msg.edit({
                    content: `page ${currentPage + 1} of ${embedPages.length}`,
                    components: [row],
                    embeds: [embedPages[currentPage]],
                });
        });
        collector.on("collect", async (res) => {
            switch (res.customId) {
                case "previousbtn":
                    if (currentPage !== 0) {
                        --currentPage;
                        await res.editReply({
                            content: `page ${currentPage + 1} of ${
                                embedPages.length
                            }`,
                            embeds: [embedPages[currentPage]],
                        });
                    }
                    break;
                case "nextbtn":
                    if (currentPage < embedPages.length - 1) {
                        currentPage++;
                        await res.editReply({
                            content: `page ${currentPage + 1} of ${
                                embedPages.length
                            }`,
                            embeds: [embedPages[currentPage]],
                        });
                    }
                    break;
            }
        });
    }
};
