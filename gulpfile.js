var gulp = require('gulp');
var eslint = require('gulp-eslint');

gulp.task('default', function() {
  return gulp.src(['src/*.js', 'test/*.js', 'lib/*.js', './gulpfile.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});
