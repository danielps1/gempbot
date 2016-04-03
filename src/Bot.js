import request      from 'request';

import cfg          from './../cfg';

import redis        from './redis';
import mysql        from './mysql';

import Irc          from './Irc';
import Filters      from './Filters';
import Parser       from './Parser';
import Handler      from './Handler';
import Timeout      from './Timeout';
import Eventhub     from './Eventhub';

// modules
import Logs         from './modules/Logs';
import Combo        from './modules/Combo';
import Nuke         from './modules/Nuke';
import Lines        from './modules/Lines';
import Randomquote  from './modules/Randomquote';
import LastMessage  from './modules/LastMessage';
import Voting       from './modules/Voting';
import Followage    from './modules/Followage';
import Chatters     from './modules/Chatters';
import Oddshots     from './modules/Oddshots';
import Emotecount   from './modules/Emotecount';



export default class Bot {

    constructor() {
        this.cfg      = cfg;
        this.admins   = cfg.admins;
        this.name     = cfg.irc.username;
        this.redis    = redis;
        this.mysql    = mysql;
        this.irc      = new Irc(this);
        this.parser   = new Parser(this);
        this.handler  = new Handler(this);
        this.filters  = new Filters(this);
        this.timeout  = new Timeout(this);
        this.eventhub = new Eventhub(this);
        this.modules  = {
            logs:        new Logs(this),
            combo:       new Combo(this),
            lines:       new Lines(this),
            randomquote: new Randomquote(this),
            nuke:        new Nuke(this),
            lastmessage: new LastMessage(this),
            voting:      new Voting(this),
            followage:   new Followage(this),
            chatters:    new Chatters(this),
            emotecount:  new Emotecount(this),
            oddshots:    new Oddshots(this)
        };
        this.channels  = {};
        this.cmdcds    = [];
        this.usercds   = [];
        this.bttv      = {
            channels: {},
            global: []
        };
        this.configs   = [
            'filterlinks',
            'filterlength',
            'filterascii',
            'combos'
        ];
        this.loadChannels();
        this.loadBttvEmotes();
    }

    loadChannels() {
        console.log('[redis|API] caching configs and loading emotes');
        this.redis.hgetall('channels', (err, results) =>  {
           if (err) {
               console.log('[REDIS] ' + err);
           } else {
                for (var channel in results) {
                    this.loadChannel(channel, results[channel]);
                    this.setConfigForChannel(channel);
                    this.loadBanphrases(channel);
                    this.loadBttvChannelEmotes(channel);
                }
           }
       });
    }

    loadBanphrases(channel) {
        if (typeof this.channels[channel]['banphrases'] == 'undefined') {
            this.channels[channel]['banphrases'] = [];
        }
        this.redis.hgetall(channel + ':banphrases', (err, results) => {
            if (err) {
                console.log(err);
                return;
            }
            if (results == null) results = {};
            for (var phrase in results) {
                this.channels[channel].banphrases.push(phrase.toLowerCase());
            }
        });
    }

    loadBttvEmotes() {
        console.log('[API] fetching bttv global emotes');
        request('https://api.betterttv.net/2/emotes', (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var bttvObj = JSON.parse(body);
                var emotes  = bttvObj.emotes;
                for (var i = 0; i < emotes.length; i++) {
                    this.redis.hset('bttvemotes', emotes[i].code, emotes[i].id);
                    this.bttv.global.push(emotes[i].code);
                }
            }
        })
    }

    loadBttvChannelEmotes(channel) {
        this.bttv.channels[channel] = [];
        request('https://api.betterttv.net/2/channels/' + channel.substr(1), (error, response, body) => {
            if (!error && response.statusCode == 200) {
                var bttvObj = JSON.parse(body);
                var emotes  = bttvObj.emotes;
                for (var j = 0; j < emotes.length; j++) {
                    this.redis.hset(channel + ':bttvchannelemotes', emotes[j].code, emotes[j].id);
                    this.bttv.channels[channel].push(emotes[j].code);
                }
            }
        });

    }

    loadChannel(channel, response) {
        this.modules.logs.createFolder(channel);
        this.channels[channel] = {};
        this.channels[channel]['config'] = {};
        this.channels[channel].config['response'] = response;
        this.setConfigForChannel(channel);
    }

    setConfigForChannel(channel) {
        redis.hgetall(channel + ':config', (err, results) => {
            for (var cfg in results) {
                this.channels[channel].config[cfg.toLowerCase()] = results[cfg].toLowerCase();
            }
        });
    }

    whisper(username, message) {
        this.irc.output('#jtv', '/w ' + username + ' ' + message);
    }

    say(channel, message)
    {
        try {
            var response = this.channels[channel].config.response;
        } catch (err) {
            console.log(err);
            var response = 0;
        }
        if (response == 0) {
            return;
        }
        this.irc.output(channel, message);
    }

    getConfig(channel, configName)
    {
        configName = configName.toLowerCase();
        var conf   = this.channels[channel].config[configName];
        if (typeof conf == 'undefined') {
            return null;
        }
        return conf;
    }
}
