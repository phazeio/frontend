var gulp       = require('gulp')
	, concat     = require('gulp-concat')
	, uglify     = require('gulp-uglify')
  , watch      = require('gulp-watch')
	, rename     = require('gulp-rename')
  , babel      = require('gulp-babel');

gulp.task('concat', function() {
  return gulp.src(['./app/fontend/game.js', './app/frontend/pts/*.js'])
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
  return gulp.src(['./app/frontend/game.js', './app/frontend/pts/*.js'])
    .pipe(concat('sperm.con.js'))
    .pipe(rename('sperm.min.js'))
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
})

gulp.task('stream', function () {
    return gulp.src(['./app/frontend/game.js', './app/frontend/pts/*.js'])
    .pipe(watch(['./src/game.js', './src/pts/*.js']))
    .pipe(concat('sperm.con.js'))
    .pipe(rename('sperm.min.js'))
    .pipe(babel({presets: ['es2015']}))
    .pipe(uglify())
    .pipe(gulp.dest('./public/js'));
});