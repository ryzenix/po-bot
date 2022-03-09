const Command = require('../../structures/Command');

module.exports = class PingCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'ping',
            description: "Ping the bot",
        })
    }
    async run(message) {
        const pingMessage = await message.channel.send(`almost there...`);
        const ping = pingMessage.createdTimestamp - message.createdTimestamp;
        return pingMessage.edit(`:ping_pong: pong! took me ${ping}ms, and Discord ${Math.round(this.client.ws.ping)}ms`);
    };
};