module.exports = async(client, guild) => {

    const guildexist = await client.dbguilds.findOne({
        guildID: guild.id
    });

    if (guildexist) return;
    const Guild = client.dbguilds;
    const newGuild = new Guild({
        guildID: guild.id
    });
    await newGuild.save();
    logger.log('info', `New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`)
};