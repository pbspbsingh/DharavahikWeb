const path = require('path');
const webpack = require('webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: "development",
    devtool: 'inline-source-map',
    entry: {
        react: ['react/index.js', 'react-dom/index.js'],
        style: ['./src/client/layout.scss'],
        main: ['./src/client/main.tsx']
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist/public'),
        publicPath: '/public/'
    },
    plugins: [
        new CleanWebpackPlugin(['./dist']),
        new HtmlWebpackPlugin({
            template: './src/client/index.template.html',
            hash: true
        }),
        new CopyWebpackPlugin([
            { from: path.resolve(__dirname, './src/public/'), to: path.resolve(__dirname, './dist/public/') }
        ]),
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.[s]*css$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader"
                ]
            },
            {
                test: /\.(gif|eot|svg|ttf|woff|woff2)$/,
                loader: 'file-loader?name=fonts/[name].[ext]'
            },
            {
                test: /\.ts[x]*?$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            babelrc: false,
                            plugins: ['react-hot-loader/babel'],
                        },
                    },
                    'ts-loader'
                ],
            }
        ]
    },
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    },
    devServer: {
        index: 'index.html',
        contentBase: './dist/public',
        port: 3000,
        proxy: {
            '/': 'http://127.0.0.1:8000'
        }
    }
};