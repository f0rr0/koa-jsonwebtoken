const { resolve } = require('path');
const { dependencies } = require('./package.json');

const nodeModules = {};

Object
    .keys(dependencies)
    .forEach((mod) => {
     nodeModules[mod] = `commonjs ${mod}`;
    });

module.exports = (env = { dev: true }) => ({
    context: resolve(__dirname),
    entry: {
     index: env.prod ? './main.js' : ['webpack/hot/poll?1000', './main.js']
    },
    target: 'node',
    output: {
     filename: '[name].js',
     path: resolve(__dirname, './build'),
     pathinfo: !env.prod,
     libraryTarget: 'commonjs-module'
    },
    devtool: env.prod ? 'source-map' : 'eval',
    module: {
     loaders: [
       {
         test: /\.js$/,
         exclude: /node_modules/,
         loaders: [
           'babel-loader'
         ]
       }
     ]
    },
    externals: nodeModules
});
