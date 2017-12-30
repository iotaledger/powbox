import React from 'react';

import Authenticate from './Authenticate';
import Markdown from './Markdown';

import appCss from './app.css';
import * as constants from './constants';

const libs = [
    { icon: 'devicon-nodejs-plain colored', name: 'Node.JS', repo: 'iota.lib.js' },
    { icon: 'devicon-python-plain colored', name: 'Python', repo: 'iota.lib.py' },
    { icon: 'devicon-go-plain colored', name: 'Go', repo: 'iota.lib.go' },
    { icon: 'devicon-csharp-plain colored', name: 'C#', repo: 'iota.lib.csharp' },
    { icon: 'devicon-java-plain colored', name: 'Java', repo: 'iota.lib.java' }
];

export default class App extends React.Component {
    render() {
        return (
            <div className="app-container marked">
                <Markdown>
                    {constants.introText}
                    {constants.authenticationText}
                    <Authenticate />
                    {constants.usageText}
                    <ul className="library-list">
                        {libs.map(lib => (
                            <li className="library" key={lib.repo}>
                                <a target="_blank" href={`https://github.com/iotaledger/${lib.repo}`}>
                                    <i className={lib.icon} />
                                    <span>{lib.name}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    {constants.apiDocs}
                </Markdown>
            </div>
        );
    }
}
