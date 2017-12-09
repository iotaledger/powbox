require('../common/env');

const log = console.log;
const express = require('express');
const bodyParser = require('body-parser');
const pubsub = require('../common/pubsub');
const apiCommands = require('./commands');

const app = express();

app.use(bodyParser.json());

app.use((req, res, next) => {
    req.pubsub = pubsub.client;
    next();
});

app.post('/api/v1/commands', apiCommands);

async function run() {
    await pubsub.init();

    app.listen(3000, () => {
        console.log('Listening on port 3000...');
    });
}

run();
