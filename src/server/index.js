require('../common/env');

const log = console.log;
const express = require('express');
const bodyParser = require('body-parser');

const { job } = require('../common/db');
const apiCommands = require('./commands');
const mq = require('./rabbit');
const rateLimiter = require('./rateLimiter');

const app = express();

app.use(bodyParser.json());

app.use(rateLimiter());

app.post('/api/v1/commands', apiCommands);

app.get('/api/v1/jobs/:jobId', async (req, res) => {
    try {
        const j = (await job.get(req.params.jobId)).toJSON();

        delete j.request;

        res.json(j);
    } catch (e) {
        console.error(e);

        res.status(400);
        res.send(e.message);
    }
});

app.listen(3000, () => {
    console.log('Listening on port 3000...');
});

mq.listen();
