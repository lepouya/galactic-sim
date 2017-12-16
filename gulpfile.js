var gulp = require('gulp');
var gutil = require('gulp-util');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var tsify = require('tsify');
var babelify = require('babelify');
var browserify = require('browserify');
var uglify = require('gulp-uglify');
var watchify = require('watchify');
var sass = require('gulp-sass');
var pug = require('gulp-pug');
var connect = require('gulp-connect');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

const package = 'galactic-sim';
const outDir = 'dist';
const htmlEntries = ['src/index.pug'];
const cssEntries = ['src/index.scss'];
const jsEntries = ['src/index.tsx'];
const extensions = ['.js', '.ts', '.jsx', '.tsx', '.json'];

gulp.task('prod', function () {
  process.env.NODE_ENV = 'production';
});

gulp.task('dev', function () {
  process.env.NODE_ENV = 'development';
});

gulp.task('watching', function () {
  process.env.NODE_ENV = 'development';
  process.env.watching = true;
});

gulp.task('html', function () {
  const debug = (process.env.NODE_ENV !== 'production');
  const jsName = package + (debug ? '.js' : '.min.js');
  const cssName = package + (debug ? '.css' : '.min.css');
  
  return gulp
    .src(htmlEntries)
    .pipe(pug({
      pretty: debug,
      locals: {
        jsSource: jsName,
        cssSource: cssName,
      }
    }))
    .pipe(gulp.dest(outDir));
});

gulp.task('sass', function () {
  const debug = (process.env.NODE_ENV !== 'production');
  const cssName = package + (debug ? '.css' : '.min.css');

  return gulp
    .src(cssEntries)
    .pipe(sass({
      includePaths: ['node_modules/foundation-sites/scss'],
      outputStyle: (debug ? 'expanded' : 'compressed'),
      outFile: cssName,
    }))
    .pipe(rename(cssName))
    .pipe(gulp.dest(outDir));
});

gulp.task('ts', function () {
  return bundle();
});

gulp.task('server', function () {
  connect.server({
    name: package,
    root: outDir,
    port: 8080,
    livereload: true,
  });
});

gulp.task('compile', ['html', 'sass', 'ts'], function () {});
gulp.task('release', ['prod', 'compile'], function () {});
gulp.task('debug', ['dev', 'compile'], function () {});
gulp.task('watch', ['watching', 'compile'], function () {});
gulp.task('start', ['watch', 'server'], function () {});

var bundler = null;

function bundle() {
  const debug = (process.env.NODE_ENV !== 'production');
  const bundleName = package + (debug ? '.js' : '.min.js');

  if (!bundler) {
    bundler = browserify({
        basedir: '.',
        debug: debug,
        entries: jsEntries,
        extensions: extensions,
      })
      .plugin(tsify, {
        target: 'ES5',
        module: 'ESNext',
        lib: ['DOM', 'ESNext'],
        allowSyntheticDefaultImports: true,
      })
      .transform(babelify.configure({
        presets: ['env', 'react'],
        extensions: extensions,
      }));

    if (process.env.watching) {
      bundler = watchify(bundler);
      bundler.on("update", bundle);
      bundler.on("log", gutil.log);
    }
  }

  let fs = bundler
    .bundle()
    .pipe(source(bundleName))
    .pipe(buffer());

  if (debug) {
    fs = fs
      .pipe(sourcemaps.init({
        loadMaps: true
      }))
      .pipe(sourcemaps.write('./'))
  } else {
    fs = fs
      .pipe(uglify());
  }

  return fs
    .pipe(gulp.dest(outDir))
    .pipe(connect.reload());
}