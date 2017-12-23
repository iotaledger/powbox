const path = require('path');

module.exports = {
    entry: './src/client/index.jsx',
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
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(__dirname, 'src/server/public'),
        compress: true,
        port: 9000
    }
};
