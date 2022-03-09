const fs = require('fs');

module.exports = async(client) => {
    fs.readdir("./commands/", (err, categories) => {
        if (err) logger.log('error', err);
        logger.log('info', `Found total ${categories.length} categories.`);
        categories.forEach(category => {
            let moduleConf = require(`../commands/${category}/module.json`);
            if (!moduleConf) return;
            moduleConf.path = `./commands/${category}`;
            moduleConf.cmds = [];
            client.helps.set(moduleConf.name, moduleConf);

            fs.readdir(`./commands/${category}`, (err, files) => {
                logger.log('info', `Found total ${files.length - 1} command(s) from ${category}.`);
                if (err) logger.log('error', err);
                files.forEach(file => {
                    if (!file.endsWith(".js")) return;
                    let Command = require(`../commands/${category}/${file}`);
                    let prop = new Command(client);
                    client.commands.set(prop.name, prop);
                    prop.aliases.forEach(alias => {
                        client.aliases.set(alias, prop.name);
                    });
                    client.helps.get(moduleConf.name).cmds.push({ name: prop.name, desc: prop.description });
                });
            });
        })
    });
};