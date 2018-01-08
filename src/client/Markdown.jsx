import PropTypes from 'prop-types';
import React from 'react';
import marked from 'marked';

export default class Markdown extends React.Component {
    render() {
        return React.Children.map(this.props.children, child => {
            if (typeof child === 'string') {
                // eslint-disable-next-line react/no-danger
                return <div dangerouslySetInnerHTML={{ __html: marked(child) }} />;
            }

            return child;
        });
    }
}

Markdown.propTypes = {
    children: PropTypes.node.isRequired
};
