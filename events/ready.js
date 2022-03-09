const { purgeDbGuild } = require('../util/Util');
const music = require('../middleware/music');

module.exports = async client => {
    logger.log('info', `[DISCORD] Logged in as ${client.user.tag}!`);
    client.finished = false;
    logger.log('info', '[DISCORD] Fetching server...');
    const allServer = await client.dbguilds.find({});
    if (allServer.length) {
        for (const guild of allServer) {
            try {
                await client.guilds.fetch(guild.guildID);
            } catch (err) {
                await purgeDbGuild(client, guild.guildID);
                logger.log('info', `Kicked from an undefined server (id: ${guild.guildID}).`);
            };
        };
    };
    await music.init(client);
    logger.log('info', `[DISCORD] Finished loading!`);
    client.finished = true;
};