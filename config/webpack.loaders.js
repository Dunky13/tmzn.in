const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const config = require('./site.config');

const sourceMap = config.env !== 'production';
const styleLoader = config.env === 'production'
  ? MiniCssExtractPlugin.loader
  : 'style-loader';
const cssLoader = { loader: 'css-loader', options: { sourceMap } };
const postcssLoader = {
  loader: 'postcss-loader',
  options: {
    postcssOptions: { plugins: [require('autoprefixer')()] },
    sourceMap,
  },
};

module.exports = [
  { test: /\.html$/, loader: 'html-loader' },
  {
    test: /\.jsx?$/,
    exclude: /node_modules/,
    loader: 'babel-loader',
    options: { presets: ['@babel/preset-env'] },
  },
  { test: /\.css$/, use: [styleLoader, cssLoader, postcssLoader] },
  {
    test: /\.s[ac]ss$/,
    use: [styleLoader, cssLoader, postcssLoader, {
      loader: 'sass-loader',
      options: { implementation: require('sass'), sourceMap },
    }],
  },
  {
    test: /\.less$/,
    use: [styleLoader, cssLoader, postcssLoader, {
      loader: 'less-loader', options: { sourceMap },
    }],
  },
  {
    test: /\.(gif|png|jpe?g|svg)$/i,
    exclude: /fonts/,
    type: 'asset/resource',
    generator: { filename: 'images/[name].[contenthash][ext]' },
  },
  {
    test: /\.(woff2?|eot|ttf|otf|svg)$/,
    exclude: /images/,
    type: 'asset/resource',
    generator: { filename: 'fonts/[name].[contenthash][ext]' },
  },
  {
    test: /\.(mp4|webm)$/,
    type: 'asset/resource',
    generator: { filename: 'images/[name].[contenthash][ext]' },
  },
];
