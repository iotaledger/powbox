const fetch = require('node-fetch');
const qs = require('query-string');

const getAccessToken = code => {
    const queryString = qs.stringify({
        code,
        client_id: process.env.GITHUB_APP_CLIENT_ID,
        client_secret: process.env.GITHUB_APP_CLIENT_SECRET
    });

    return fetch(`https://github.com/login/oauth/access_token?${queryString}`, {
        headers: {
            Accept: 'application/json'
        },
        method: 'POST'
    }).then(res => res.json());
};

const getUserEmail = accessToken => {
    return fetch('https://api.github.com/user/emails', {
        headers: {
            Authorization: `token ${accessToken}`
        }
    })
        .then(res => res.json())
        .then(res => {
            if (res.error) {
                return res;
            }

            const verifiedEmails = res.filter(each => each.verified);

            if (verifiedEmails.length === 0) {
                return {
                    error: 'no_verified_emails',
                    error_description:
                        'You must have at least one verified email address registered with your GitHub account.'
                };
            }

            const primaryEmail = verifiedEmails.filter(each => each.primary);

            if (primaryEmail.length === 0) {
                return verifiedEmails[0];
            } else {
                return primaryEmail[0];
            }
        });
};

module.exports = (req, res) => {
    const githubToken = req.headers['x-github-token'];

    if (!githubToken) {
        return res.status(400).send('Missing required header X-Github-Token');
    }

    getAccessToken(githubToken)
        .then(data => {
            if (data.error) {
                res.status(400);
                res.send(data.error_description);
                return null;
            }

            return getUserEmail(data.access_token);
        })
        .then(data => {
            if (data === null) {
                return;
            }

            if (data.error) {
                res.status(400);
                res.send(data.error_description);
            }

            console.log(data.email);
            res.sendStatus(201);
        });
};
