const webpack = require('./webpack.config');
Object.assign(webpack, {
    mode: "production",
    devtool: 'source-map',
});

module.exports = webpack;