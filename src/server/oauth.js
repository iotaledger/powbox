const fetch = require('node-fetch');
const qs = require('query-string');

const { createOrGetToken } = require('./tokens');

const httpOk = res => 200 <= res.status && res.status < 300;

const getAccessToken = async code => {
    const queryString = qs.stringify({
        code,
        client_id: process.env.GITHUB_APP_CLIENT_ID,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET
    });

    const res = await fetch(`https://github.com/login/oauth/access_token?${queryString}`, {
        headers: {
            Accept: 'application/json'
        },
        method: 'POST'
    });

    const json = await res.json();

    if (!httpOk(res)) {
        throw json;
    }

    return json.access_token;
};

const getUserId = async accessToken => {
    const res = await fetch('https://api.github.com/user', {
        headers: {
            Authorization: `token ${accessToken}`
        }
    });

    const json = await res.json();

    if (!httpOk(res)) {
        throw json;
    }

    return json.id;
};

const getUserEmail = async accessToken => {
    const res = await fetch('https://api.github.com/user/emails', {
        headers: {
            Authorization: `token ${accessToken}`
        }
    });

    const json = await res.json();

    if (!httpOk(res)) {
        throw json;
    }

    const verifiedEmails = json.filter(each => each.verified);

    if (verifiedEmails.length === 0) {
        throw {
            error: 'no_verified_emails',
            error_description: 'You must have at least one verified email address registered with your GitHub account.'
        };
    }

    const primaryEmail = verifiedEmails.filter(each => each.primary)[0];

    return (primaryEmail || verifiedEmails[0]).email;
};

module.exports = async (req, res) => {
    const githubToken = req.headers['x-github-token'];

    if (!githubToken) {
        return res.status(400).send('Missing required header X-Github-Token');
    }

    try {
        const accessToken = await getAccessToken(githubToken);
        const id = await getUserId(accessToken);
        const email = await getUserEmail(accessToken);
        const apikey = await createOrGetToken({ id, email });

        res.status(200).json({ apikey });
    } catch (e) {
        if (e.error) {
            console.error(e.error + ': ' + e.error_description);
            res.status(400);
            res.send(e.error_description);
        } else {
            console.error(e);
            res.status(400);
            res.send(e.message);
        }
    }
};
