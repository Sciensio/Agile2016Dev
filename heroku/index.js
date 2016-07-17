'use strict';

const smoochBot = require('smooch-bot');
const MemoryLock = smoochBot.MemoryLock;
const SmoochApiStore = smoochBot.SmoochApiStore;
const SmoochApiBot = smoochBot.SmoochApiBot;
const StateMachine = smoochBot.StateMachine;
const app = require('../app');
const script = require('../script');
const SmoochCore = require('smooch-core');
const jwt = require('../jwt');
const fs = require('fs');

class BetterSmoochApiBot extends SmoochApiBot {
    constructor(options) {
        super(options);
    }

    sendImage(imageFileName) {
        const api = this.store.getApi();
        let message = Object.assign({
            role: 'appMaker'
        }, {
            name: this.name,
            avatarUrl: this.avatarUrl
        });
        var real = fs.realpathSync(imageFileName);
        let source = fs.readFileSync(real);

        return api.conversations.uploadImage(this.userId, source, message);
    }
}

const name = 'A16';
const avatarUrl = 'https://raw.githubusercontent.com/Sciensio/Agile2016Dev/master/img/agile-alliance-logo-bot.png';
const store = new SmoochApiStore({
    jwt
});
const lock = new MemoryLock();

//start of experiment

var pg = require('pg');
var Pool = require('pg').Pool;

pg.defaults.ssl = true;
var pool1 = new Pool ({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  max: process.env.DB_CONNECTION_LIMIT,
  idleTimeoutMillis: 1000
});

pool1.on('error', function(e, client) {
    console.log('|| Error in DB pool1 in index: ',e );
});


//end of experiment

function createWebhook(smoochCore, target) {
    return smoochCore.webhooks.create({
            target,
            triggers: ['message:appUser']
        })
        .then((res) => {
            console.log('Smooch webhook created at target', res.webhook.target);
            return smoochCore.webhooks.create({
                        target,
                        triggers: ['postback']
                    })
                    .then((res) => {
                        console.log('Smooch postback webhook created at target', res.webhook.target);
                    })
                    .catch((err) => {
                        console.error('Error creating Smooch webhook:', err);
                        console.error(err.stack);
                    });
            }
        )
        .catch((err) => {
            console.error('Error creating Smooch webhook:', err);
            console.error(err.stack);
        });
}

// Create a webhook if one doesn't already exist
if (process.env.SERVICE_URL) {
    const target = process.env.SERVICE_URL.replace(/\/$/, '') + '/webhook';
    const smoochCore = new SmoochCore({
        jwt
    });
    smoochCore.webhooks.list()
        .then((res) => {
            if (!res.webhooks.some((w) => w.target === target)) {
                createWebhook(smoochCore, target);
            }
        });
}

app.post('/webhook', function(req, res, next) {
    var isPostback = req.body.trigger == "postback";
    var msg = '';
//console.log("=in app.post");
    const appUser = req.body.appUser;
    const userId = appUser.userId || appUser._id;
    const stateMachine = new StateMachine({
        script,
        bot: new BetterSmoochApiBot({
            name,
            avatarUrl,
            lock,
            store,
            userId
        })
    });

    if(!isPostback) {
        const messages = req.body.messages.reduce((prev, current) => {
            if (current.role === 'appUser') {
                prev.push(current);
            }
            return prev;
        }, []);

        if (messages.length === 0 && !isTrigger) {
            return res.end();
        }

        msg = messages[0];
    } else {
        msg = req.body.postbacks[0];
        console.log("=== POSTBACK",msg.action.payload);
        msg.text = msg.action.payload;
    }

    stateMachine.receiveMessage(msg)
        .then(() => res.end())
        .catch((err) => {
            console.error('SmoochBot error:', err);
            console.error(err.stack);
            res.end();
        });
});

var server = app.listen(process.env.PORT || 8000, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Smooch Bot listening at http://%s:%s', host, port);
});

module.exports = pool1;
