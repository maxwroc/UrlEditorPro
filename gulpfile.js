var fs =            require('fs');
var gulp =          require('gulp');
var concat =        require('gulp-concat');
var html2string =   require('gulp-html2string');
var typescript =    require('gulp-typescript');
var zip =           require('gulp-zip');
var KarmaServer =   require('karma').Server;

//#region build commands
gulp.task('build-popup', function () {
    let tsProject = typescript.createProject('tsconfig.json', { outFile: 'popup.js' });
    return gulp.src(['UrlEditorPRO/app/popup.ts'])
        .pipe(tsProject())
        .pipe(gulp.dest('UrlEditorPRO/app/'));
});

gulp.task('build-options', function () {
    let tsProject = typescript.createProject('tsconfig.json', { outFile: 'options.js' });
    return gulp.src(['UrlEditorPRO/app/options.ts', 'UrlEditorPRO/app/options/**/*.ts'])
        .pipe(tsProject())
        .pipe(gulp.dest('UrlEditorPRO/app/'));
});

gulp.task('build-background', function () {
    let tsProject = typescript.createProject('tsconfig.json', { outFile: 'background.js' });
    return gulp.src(['UrlEditorPRO/app/modules/tracking.ts', 'UrlEditorPRO/app/modules/redirection.ts', 'UrlEditorPRO/app/modules/autorefresh.ts', 'UrlEditorPRO/app/background.ts'])
        .pipe(tsProject())
        .pipe(gulp.dest('UrlEditorPRO/app/'));
})

gulp.task('build', ['build-popup', 'build-options', 'build-background'], function () {
    let tsProject = typescript.createProject('tsconfig.json', { outFile: 'app.js' });
    return gulp.src(['UrlEditorPRO/app/modules/**/*.ts', 'UrlEditorPRO/app/shared/**/*.ts'])
        .pipe(tsProject())
        .pipe(gulp.dest('UrlEditorPRO/app/'));
});
//#endregion

//#region build and run tests
gulp.task('build-test-internal', function () {
    let tsProject = typescript.createProject('tsconfig.json', { outFile: 'aggregate.tests.js' });
    return gulp.src('UrlEditorPRO.Tests/spec/**/*.ts')
        .pipe(tsProject())
        .pipe(gulp.dest('UrlEditorPRO.Tests/spec/'));
});

gulp.task('templates-html2js', function () {
    return gulp.src('UrlEditorPRO/app/*.html')
        .pipe(html2string({
            base: 'UrlEditorPRO/app/',
            createObj: true, // Indicate wether to define the global object that stores
            // the global template strings
            objName: 'TEMPLATES'  // Name of the global template store variable
            //say the converted string for myTemplate.html will be saved to TEMPLATE['myTemplate.html']
        }))
        .pipe(concat('templates.js'))
        .pipe(gulp.dest('UrlEditorPRO.Tests/spec/')); //Output folder
});

gulp.task('build-test', ['templates-html2js', 'build-test-internal']);

gulp.task('run-tests', function (done) {
    new KarmaServer({
      configFile: __dirname + '/karma.conf.js',
      singleRun: true
    }, done).start();
});

gulp.task('test', ['build-test'], function(done) {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
      }, done).start();
});

gulp.task('test-ci', ['build', 'build-test'], function(done) {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: true
    }, done).start();
});

gulp.task('test-ci-debug', ['build', 'build-test'], function(done) {
    new KarmaServer({
        configFile: __dirname + '/karma.conf.js',
        singleRun: false
    }, done).start();
});
//#endregion

gulp.task('release', function() {
    var manifest = require('./UrlEditorPRO/app/manifest.json');
    var version = manifest.version;
    if(process.argv.indexOf('--bump') != -1) {
        var chunks = version.split('.');
        chunks[chunks.length - 1]++;
        version = chunks.join('.');
        manifest.version = version;

        fs.writeFileSync('./UrlEditorPRO/app/manifest.json', JSON.stringify(manifest, null, 2))
    }

    var zipName = manifest.name.replace(/\s/g, "") + "_v" + version + ".zip";

    return gulp.src(['UrlEditorPRO/app/**/*', '!UrlEditorPRO/app/**/*.ts'])
    .pipe(zip(zipName))
    .pipe(gulp.dest('release'));
});

gulp.task('watch', ['build'], function () {
    gulp.watch('UrlEditorPRO/app/**/*.ts', ['build']);
});

gulp.task('watch-test', function () {
    gulp.watch('UrlEditorPRO/app/**/*.ts', ['build']);
    gulp.watch('UrlEditorPRO/app/**/*.html', ['templates-html2js']);
    gulp.watch('UrlEditorPRO.Tests/spec/**/*.ts', ['build-test-internal']);
});