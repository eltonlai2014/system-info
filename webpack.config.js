const path = require('path');
// var webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
module.exports = {
    target:'node',
    // mode:'development',
    mode:'production',
    node: {
        __dirname: true, // otherwise path gets confused. more @ https://webpack.js.org/configuration/node/#node-__dirname
    },    
    entry: path.resolve(__dirname, './index.js'),
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname + '/dist'),
        // libraryTarget: 'commonjs'
    },    
    externals: [nodeExternals()],    
    resolve: {
        extensions: ['.js'],        
      },

    // plugins: [
    //     new webpack.IgnorePlugin({
    //         contextRegExp: /assets$/,
    //     }),
    // ]

};
