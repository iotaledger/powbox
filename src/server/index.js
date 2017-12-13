require('../common/env');

const log = console.log;
const express = require('express');
const bodyParser = require('body-parser');
const apiCommands = require('./commands');

const app = express();

app.use(bodyParser.json());

app.post('/api/v1/commands', apiCommands);

app.listen(3000, () => {
    console.log('Listening on port 3000...');
});
