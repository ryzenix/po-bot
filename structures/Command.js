const { PermissionResolvable } = require('discord.js');
const Client = require('../structures/Client');

module.exports = class Command {
    /**
     * @typedef {Object}
     * @property {string} name - The name of the command (must be lowercase)
     * @property {string[]} [aliases] - Alternative names for the command (all must be lowercase)
     * @property {string} description - The description of the command
     * @property {string[]} [examples] - Usage examples of the command
     * @property {string[]} [usages] - The usage of the command
     * @property {boolean} [guildOnly=false] - Whether or not the command should only function in a guild channel
     * @property {boolean} [ownerOnly=false] - Whether or not the command is usable only by an owner
     * @property {PermissionResolvable[]} [clientPermissions] - Permissions required by the client to use the command.
     * @property {PermissionResolvable[]} [userPermissions] - Permissions required by the user to use the command.
     * @property {PermissionResolvable[]} [channelPermissions] - Permissions required by the channel to use the command.
     * @property {boolean} [nsfw=false] - Whether the command is usable only in NSFW channels.
     * @property {number} cooldown - Options the command cooldown

    /**
     * @param {Client} client - The client the command is for
     */
    constructor(client, info) {

        /**
         * Client that this command is for
         * @name Command#client
         * @type {Client}
         * @readonly
         */
        this.client = client;

        /**
         * Name of this command
         * @type {string}
         */
        this.name = info.name;

        /**
         * Aliases for this command
         * @type {string[]}
         */
        this.aliases = info.aliases || [];

        /**
         * Short description of the command
         * @type {string}
         */
        this.description = info.description;

        /**
         * Example usage strings
         * @type {?string[]}
         */
        this.examples = info.examples || [];

        /**
         * Command usage strings
         * @type {?string[]}
         */
        this.usages = info.usages || [];

        /**
         * Whether the command can only be run in a guild channel
         * @type {boolean}
         */
        this.guildOnly = Boolean(info.guildOnly);

        /**
         * Whether the command can only be used by an owner
         * @type {boolean}
         */
        this.adminOnly = Boolean(info.adminOnly);

        /**
         * Whether the command can only be used by a premium user
         * @type {boolean}
         */
        this.premium = Boolean(info.premium);

        /**
         * Permissions required by the client to use the command.
         * @type {?PermissionResolvable[]}
         */
        this.clientPermissions = info.clientPermissions || [];

        /**
         * Permissions required by the user to use the command.
         * @type {?PermissionResolvable[]}
         */
        this.userPermissions = info.userPermissions || [];

        /**
         * Permissions required by the channel to use the command.
         * @type {?PermissionResolvable[]}
         */
        this.channelPermissions = info.channelPermissions || [];

        /**
         * Whether the command can only be used in NSFW channels
         * @type {boolean}
         */
        this.nsfw = Boolean(info.nsfw);

        /**
         * Options for throttling command usages (revert to 2 second when none is provided)
         * @type {Number}
         */
        this.cooldown = info.cooldown || 2;
    }
}