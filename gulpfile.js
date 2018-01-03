var gulp =          require('gulp');
var concat =        require('gulp-concat');
var html2string =   require('gulp-html2string');
var open =          require('gulp-open');
var rename =        require('gulp-rename');
var typescript =    require('gulp-typescript');
var zip =           require('gulp-zip');

var fs =            require('fs');

gulp.task('build-root', function () {
    return gulp.src(['UrlEditorPRO/app/popup.ts'])
        .pipe(typescript({
            noImplicitAny: false,
            target: "es6",
            sourceMap: false,
            declaration: false
        }))
        .pipe(gulp.dest('UrlEditorPRO/app/'));
});

gulp.task('build-options', function () {
    return gulp.src(['UrlEditorPRO/app/options.ts', 'UrlEditorPRO/app/options/**/*.ts'])
        .pipe(typescript({
            noImplicitAny: false,
            target: "es6",
            sourceMap: false,
            declaration: false,
            outFile: 'options.js'
        }))
        .pipe(gulp.dest('UrlEditorPRO/app/'));
});

gulp.task('build-background', function () {
    return gulp.src(['UrlEditorPRO/app/modules/redirection.ts', 'UrlEditorPRO/app/background.ts'])
        .pipe(typescript({
            noImplicitAny: false,
            target: "es6",
            sourceMap: false,
            declaration: false,
            outFile: 'background.js'
        }))
        .pipe(gulp.dest('UrlEditorPRO/app/'));
})

gulp.task('build', ['build-root', 'build-options', 'build-background'], function () {
    return gulp.src(['UrlEditorPRO/app/modules/**/*.ts', 'UrlEditorPRO/app/shared/**/*.ts'])
        .pipe(typescript({
            noImplicitAny: false,
            target: "es6",
            sourceMap: false,
            declaration: false,
            outFile: 'app.js'
        }))
        .pipe(gulp.dest('UrlEditorPRO/app/'));
});

gulp.task('watch', ['build'], function () {
    gulp.watch('UrlEditorPRO/app/**/*.ts', ['build']);
});


gulp.task('build-test-internal', function () {
    return gulp.src('UrlEditorPRO.Tests/spec/**/*.ts')
        .pipe(typescript({
            noImplicitAny: false,
            target: "es6",
            sourceMap: false,
            declaration: false,
            outFile: 'aggregate.tests.js'
        }))
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

gulp.task('run-tests', function () {
    return gulp.src('UrlEditorPRO.Tests/SpecRunner.html')
        .pipe(open());
});

gulp.task('build-test', ['templates-html2js', 'build-test-internal']);

gulp.task('test', ['build-test'], function() {
    return gulp.src('UrlEditorPRO.Tests/SpecRunner.html')
        .pipe(open());
});

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

gulp.task('watch-test', function () {
    gulp.watch('UrlEditorPRO/app/**/*.ts', ['build']);
    gulp.watch('UrlEditorPRO/app/**/*.html', ['templates-html2js']);
    gulp.watch('UrlEditorPRO.Tests/spec/**/*.ts', ['build-test-internal']);
});