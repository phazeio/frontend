var gulp       = require('gulp')
	, concat     = require('gulp-concat')
	, uglify     = require('gulp-uglify')
  , watch      = require('gulp-watch')
	, rename     = require('gulp-rename')
  , babel      = require('gulp-babel');

gulp.task('concat', function() {
  return gulp.src(['./app/client/Sperm.js', './app/API.js', './app/client/pts/*.js'])
    .pipe(concat('sperm.con.js'))
    .pipe(gulp.dest('./public/js'));
});

gulp.task('compress', function() {
  return gulp.src('./public/js/sperm.con.js')
  	.pipe(rename('sperm.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});

gulp.task('build', function() {
  return gulp.src(['./app/client/Sperm.js', './app/API.js', './app/client/pts/*.js'])
    .pipe(concat('sperm.con.js'))
    .pipe(rename('sperm.min.js'))
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
})

gulp.task('watch', function () {
    gulp.watch(['./app/client/Sperm.js', './app/API.js', './app/client/pts/*.js'], function () {
        gulp.run('concat');
        gulp.run('build');
    });
});