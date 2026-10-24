const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const config = require('./site.config');
const loaders = require('./webpack.loaders');
const plugins = require('./webpack.plugins');

module.exports = {
  context: path.join(config.root, config.paths.src),
  entry: [
    path.join(config.root, config.paths.src, 'javascripts/scripts.js'),
    path.join(config.root, config.paths.src, 'stylesheets/styles.scss'),
  ],
  output: {
    path: path.join(config.root, config.paths.dist),
    filename: '[name].[contenthash].js',
    clean: true,
  },
  mode: ['production', 'development'].includes(config.env)
    ? config.env
    : 'development',
  devtool: config.env === 'production'
    ? 'hidden-source-map'
    : 'eval-cheap-module-source-map',
  devServer: {
    static: { directory: path.join(config.root, config.paths.src), watch: true },
    hot: true,
    open: false,
    port: config.port,
    host: config.dev_host,
  },
  parallelism: 2,
  optimization: { minimizer: [new TerserPlugin({ parallel: 2 })] },
  module: {
    rules: loaders,
  },
  plugins,
};
