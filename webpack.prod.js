const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: ['babel-polyfill', './src/client/index.jsx'],
    resolve: {
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            { test: /\.jsx?/, use: 'babel-loader', exclude: /node_modules/ },
            { test: /\.css/, use: ['style-loader', 'css-loader'] }
        ]
    },
    output: {
        filename: 'sandbox.js',
        path: path.resolve(__dirname, 'src/server/public')
    },
    devServer: {
        contentBase: path.join(__dirname, 'src/server/public'),
        compress: true,
        port: 9000
    },
    plugins: [new UglifyJsPlugin()]
};
