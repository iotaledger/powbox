import qs from 'query-string';
import React from 'react';

const GH_AUTH_URL = `https://github.com/login/oauth/authorize?${qs.stringify({
    client_id: SANDBOX.ghClientId,
    state: SANDBOX.csrfToken,
    scope: 'user:email'
})}`;

const handleGithubRedirect = () => {
    const { code, state } = qs.parse(location.search);

    if (!code || !state) {
        return Promise.resolve();
    }

    return fetch('/api/v1/tokens', {
        credentials: 'include',
        method: 'POST',
        headers: {
            'x-csrf-token': SANDBOX.csrfToken,
            'x-github-token': code
        }
    });
};

export default class Authenticate extends React.Component {
    componentDidMount() {
        handleGithubRedirect();
    }

    render() {
        return (
            <div>
                <p>
                    <a target="_blank" href={GH_AUTH_URL}>
                        Sign in with GitHub
                    </a>
                </p>
            </div>
        );
    }
}
