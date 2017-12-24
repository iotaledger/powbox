import jwt from 'jsonwebtoken';
import qs from 'query-string';
import React from 'react';

const GH_AUTH_URL = `https://github.com/login/oauth/authorize?${qs.stringify({
    client_id: SANDBOX.ghClientId,
    state: SANDBOX.csrfToken,
    scope: 'user:email'
})}`;

const handleGithubRedirect = async () => {
    const { code, state } = qs.parse(location.search);

    if (!code || !state) {
        return Promise.resolve();
    }

    const res = await fetch('/api/v1/tokens', {
        credentials: 'include',
        method: 'POST',
        headers: {
            'x-csrf-token': SANDBOX.csrfToken,
            'x-github-token': code
        }
    });

    const json = await res.json();

    return json.apikey;
};

export default class Authenticate extends React.Component {
    constructor() {
        super();
        this.state = {
            apikey: null
        };
    }

    async componentWillMount() {
        try {
            const apikey = await handleGithubRedirect();

            this.setState(state => ({
                ...state,
                apikey
            }));
        } catch (e) {
            // ignore
        }
    }

    renderLoggedIn() {
        const data = jwt.decode(this.state.apikey);

        return (
            <div className="authentication">
                <p>Signed in as {data.email}.</p>
                <p>Your unique api key is:</p>
                <pre>{this.state.apikey}</pre>
            </div>
        );
    }

    renderLoggedOut() {
        return (
            <div className="authentication">
                <a className="signin" target="_blank" href={GH_AUTH_URL}>
                    <i class="devicon-github-plain" />
                    Grant access for API Key
                </a>
            </div>
        );
    }

    render() {
        if (this.state.apikey) {
            return this.renderLoggedIn();
        }

        return this.renderLoggedOut();
    }
}
