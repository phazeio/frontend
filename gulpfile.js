var gulp       = require('gulp')
	, concat     = require('gulp-concat')
	, uglify     = require('gulp-uglify')
  , watch      = require('gulp-watch')
	, rename     = require('gulp-rename');

gulp.task('concat', function() {
  return gulp.src(['./src/game.js', './src/pts/*.js'])
    .pipe(concat('phaze.con.js'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('compress', function() {
  return gulp.src('./public/js/phaze.con.js')
  	.pipe(rename('phaze.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});

gulp.task('build', function() {
  return gulp.src(['./src/game.js', './src/pts/*.js'])
    .pipe(concat('phze.concat.js'))
    .pipe(rename('phaze.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
})

gulp.task('stream', function () {
    return gulp.src(['./src/game.js', './src/pts/*.js'])
    .pipe(watch(['./src/game.js', './src/pts/*.js']))
    .pipe(concat('phze.concat.js'))
    .pipe(rename('phaze.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});