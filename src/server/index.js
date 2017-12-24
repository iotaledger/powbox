require('../common/env');

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const express = require('express');
const session = require('express-session');
const path = require('path');
const MongoStore = require('connect-mongo')(session);

const { connection, job } = require('../common/db');
const apiCommands = require('./commands');
const oauth = require('./oauth');
const mq = require('./rabbit');
const rateLimiter = require('./rateLimiter');

const app = express();
const csrfProtection = csrf({ cookie: false });
const parseForm = bodyParser.urlencoded({ extended: false });

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(cookieParser());
app.use(bodyParser.json());

app.use(
    session({
        resave: false,
        saveUninitialized: false,
        secret: 'b17ae8ea-5932-4b58-8243-4c217fa25e19',
        store: new MongoStore({ mongooseConnection: connection })
    })
);

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

app.post('/api/v1/tokens', csrfProtection, oauth);

app.get('*', csrfProtection, (req, res) => {
    res.render('index', {
        bundleUrl: process.env.NODE_ENV === 'production' ? 'sandbox.js' : 'http://localhost:9000/sandbox.js',
        options: JSON.stringify({
            csrfToken: req.csrfToken(),
            ghClientId: process.env.GITHUB_APP_CLIENT_ID
        })
    });
});

app.listen(3000, () => {
    console.log('Listening on port 3000...');
});

mq.listen();
