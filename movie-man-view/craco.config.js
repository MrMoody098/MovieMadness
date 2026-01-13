const webpack = require('webpack');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Get the actual path to process/browser.js
      const processBrowserPath = require.resolve('process/browser.js');
      
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        path: require.resolve('path-browserify'),
        fs: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        querystring: false,
        os: false,
        http: false,
        https: false,
        zlib: false,
        tls: false,
        net: false,
        timers: require.resolve('timers-browserify'),
        vm: require.resolve('vm-browserify'),
        buffer: require.resolve('buffer/'),
        process: processBrowserPath,
      };

      // Add alias for process/browser to resolve correctly
      if (!webpackConfig.resolve.alias) {
        webpackConfig.resolve.alias = {};
      }
      webpackConfig.resolve.alias['process/browser'] = processBrowserPath;

      // Add plugins to provide process, Buffer, and global globally
      if (!webpackConfig.plugins) {
        webpackConfig.plugins = [];
      }
      webpackConfig.plugins.push(
        // Replace 'process/browser' with 'process/browser.js' in all modules
        new webpack.NormalModuleReplacementPlugin(
          /^process\/browser$/,
          processBrowserPath
        ),
        new webpack.ProvidePlugin({
          process: processBrowserPath,
          Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        }),
        // Inject global polyfill at the top of the bundle
        new webpack.BannerPlugin({
          banner: `
            if (typeof global === 'undefined') {
              var global = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {});
            }
          `,
          raw: true,
          entryOnly: true
        })
      );

      // Fix for ESM modules - allow fully specified extensions
      webpackConfig.resolve.fullySpecified = false;

      // Add extension resolution
      if (!webpackConfig.resolve.extensions) {
        webpackConfig.resolve.extensions = ['.js', '.json', '.jsx'];
      }
      if (!webpackConfig.resolve.extensions.includes('.js')) {
        webpackConfig.resolve.extensions.unshift('.js');
      }

      // Fix CSS minimization issues - disable CSS minification temporarily
      if (webpackConfig.optimization && webpackConfig.optimization.minimizer) {
        webpackConfig.optimization.minimizer = webpackConfig.optimization.minimizer.filter(
          (plugin) => plugin.constructor.name !== 'CssMinimizerPlugin'
        );
      }

      return webpackConfig;
    },
  },
};
