const gulp = require('gulp');
const path = require('./package.json').path;
const $ = require('gulp-load-plugins')({
  pattern: ['*'],
  scope: ['devDependencies']
});
const clientName = require('./package.json').client;
const version = require('./package.json').version;
let client;

/****** SCRIPTS ******/
gulp.task('scripts', () =>
  gulp.src([
    `${path.app.js}**/*.js`
  ])
    .pipe($.sourcemaps.init())
    .pipe($.concat('forabot-' + version + '.js'))
//    .pipe($.uglify())
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(`${path.dist.js}`))
);

/****** DEMO ******/
gulp.task('demo', () =>
  gulp.src([
    `${path.app.js}**/*.js`
  ])
    .pipe($.sourcemaps.init())
    .pipe($.concat('forabot.js'))
//    .pipe($.uglify())
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(`${path.demo.js}`))
);

/****** BUILD ******/
gulp.task('build', ['scripts', 'demo']);

/****** DEFAULT ******/
gulp.task('default', ['build']);
