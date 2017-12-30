import React from 'react';
import marked from 'marked';

import Aux from './Aux';

export default class Markdown extends React.Component {
    render() {
        return React.Children.map(this.props.children, child => {
            if (typeof child === 'string') {
                return <div dangerouslySetInnerHTML={{ __html: marked(child) }} />;
            }

            return child;
        });
    }
}
