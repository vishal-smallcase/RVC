const _ = require('lodash');

const sharedConfigs = {
  context: __dirname,
  entry: {
    app: ['@babel/polyfill', './src/entrypoint.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react', ['@babel/preset-env', {
              "useBuiltIns": "entry"
            }]]
          }
        }
      },
      {
        test: require.resolve('webrtc-adapter'),
        use: 'expose-loader'
      }
    ]
  }
};

const mergeResolver = (objValue, srcValue) => (
  _.isArray(objValue) ? objValue.concat(srcValue) : undefined
);

module.exports = configs => _.mergeWith(sharedConfigs, configs, mergeResolver);
