const { purgeDbGuild } = require('../util/Util');
module.exports = async(client, guild) => {
    await purgeDbGuild(client, guild.id);
    logger.log('info', `Guild left: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`)
};