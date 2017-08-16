var gulp = require('gulp');
var typescript = require('gulp-typescript');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var open = require('gulp-open');
var html2string = require('gulp-html2string');


gulp.task('build-root', function () {
    return gulp.src('UrlEditorPRO/app/*.ts')
        .pipe(typescript({
            noImplicitAny: false,
            target: "es6",
            sourceMap: false,
            declaration: false
        }))
        .pipe(gulp.dest('UrlEditorPRO/app/'));
});

gulp.task('build', ['build-root'], function () {
    return gulp.src('UrlEditorPRO/app/modules/**/*.ts')
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

gulp.task('watch-test', function () {
    gulp.watch('UrlEditorPRO/app/**/*.ts', ['build']);
    gulp.watch('UrlEditorPRO/app/**/*.html', ['templates-html2js']);
    gulp.watch('UrlEditorPRO.Tests/spec/**/*.ts', ['build-test-internal']);
});