var gulp = require('gulp');
var rename = require('gulp-rename');
var html2string = require('gulp-html2string');
 
gulp.task('html2js', function () {
  return gulp.src('UrlEditorPRO/app/*.html')
    .pipe(html2string({
      createObj: true, // Indicate wether to define the global object that stores 
                        // the global template strings 
      objName: 'TEMPLATES'  // Name of the global template store variable 
                            //say the converted string for myTemplate.html will be saved to TEMPLATE['myTemplate.html'] 
    }))
    .pipe(rename({extname: '.js'}))
    .pipe(gulp.dest('templates/')); //Output folder 
});