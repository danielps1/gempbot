var cfg = require('./../../cfg');

var settings = {
    server : "192.16.64.180",
    port: 443,
    secure: false,
    nick : cfg.options.identity.username,
    password : cfg.options.identity.password 
}

var irc = require("irc");

var bot = new irc.Client(settings.server, settings.nick, {
    debug: true,
    password: settings.password,
    username: settings.nick
});

bot.connect(function() {
    console.log("Connected!");
});

module.exports = 
{
    bot
}