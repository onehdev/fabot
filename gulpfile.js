const gulp = require('gulp');
const path = require('./package.json').path;
const $ = require('gulp-load-plugins')({
  pattern: ['*'],
  scope: ['devDependencies']
});
const clientName = require('./package.json').client;
let client;

/****** SCRIPTS ******/
gulp.task('scripts', () =>
  gulp.src([
    `${path.app.js}**/*.js`
  ])
    .pipe($.sourcemaps.init())
    .pipe($.concat('forabot.js'))
//    .pipe($.uglify())
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(`${path.dist.js}`))
);

/****** BUILD ******/
gulp.task('build', ['scripts']);

/****** DEFAULT ******/
gulp.task('default', ['build']);
