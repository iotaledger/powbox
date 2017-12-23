require('../common/env');

const bodyParser = require('body-parser');
const express = require('express');
const path = require('path');

const { job } = require('../common/db');
const apiCommands = require('./commands');
const mq = require('./rabbit');
const rateLimiter = require('./rateLimiter');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.post('/api/v1/commands', rateLimiter(), apiCommands);

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

app.get('*', (req, res) => {
    res.render('index', {
        bundleUrl: process.env.NODE_ENV === 'production' ? 'sandbox.js' : 'http://localhost:9000/sandbox.js'
    });
});

app.listen(3000, () => {
    console.log('Listening on port 3000...');
});

mq.listen();
