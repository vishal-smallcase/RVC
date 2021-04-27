const { DefinePlugin, HotModuleReplacementPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const socketConfig = require('../config.json');
const addBaseConfig = require('./webpack-base.config');

const configs = addBaseConfig({
  mode: 'development',
  output: {
    filename: 'js/[name].js',
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|otf|svg|gif|jpeg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'assets'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      SOCKET_HOST: JSON.stringify(`http://localhost:5555`),
      API_URL: JSON.stringify(`https://xml-backend-build.invoid.co`)
    }),
    new HotModuleReplacementPlugin(),
    new HtmlWebpackPlugin({
      title: 'React VideoCall',
      filename: 'index.html',
      template: 'src/html/index.html'
    })
  ],
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
    compress: true,
    port: 9555,
    historyApiFallback: true,
    watchOptions: {
      aggregateTimeout: 300,
      poll: 1000
    }
  }
});

module.exports = configs;
