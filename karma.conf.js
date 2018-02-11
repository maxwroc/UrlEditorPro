// Karma configuration
// Generated on Tue Jan 16 2018 23:04:59 GMT+0000 (GMT Standard Time)

module.exports = function(config) {
  var configuration = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      { pattern: 'UrlEditorPRO/app/**/*.png', watched: true, included: false, served: true },
      { pattern: 'UrlEditorPRO/app/app.js', watched: true, included: false, served: true },
      'UrlEditorPRO/app/popup.js',
      'UrlEditorPRO/app/options.js',
      'UrlEditorPRO.Tests/libs/bililiteRange.js',
      'UrlEditorPRO.Tests/libs/jquery.js',
      'UrlEditorPRO.Tests/libs/jquery.simulate.js',
      'UrlEditorPRO.Tests/libs/jquery.simulate.ext.js',
      'UrlEditorPRO.Tests/libs/jquery.simulate.key-sequence.js',
      'UrlEditorPRO.Tests/libs/jquery.simulate.key-combo.js',
      'UrlEditorPRO.Tests/spec/templates.js',
      'UrlEditorPRO.Tests/spec/aggregate.tests.js'
    ],


    // list of files / patterns to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
  };

  if (process.env.TRAVIS) {
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
}
