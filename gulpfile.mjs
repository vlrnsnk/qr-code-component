import gulp from 'gulp';
const { task, watch, src, dest, series, parallel } = gulp;
import browserSync from 'browser-sync';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';
const sass = gulpSass(dartSass);
import {deleteSync} from 'del';
import minify from 'gulp-html-minifier-terser';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import sourcemap from 'gulp-sourcemaps';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import webp from 'gulp-webp';
import sharpOptimizeImages from 'gulp-sharp-optimize-images';

/* Run BrowserSync server */

task('server', () => {
  browserSync({
    server: {
      baseDir: 'build/',
    }
  });

  watch('build/*.html').on('change', browserSync.reload);
});

/* Compile SCSS styles */

task('styles', () => {
  return src('src/sass/style.scss')
    .pipe(plumber())
    .pipe(sourcemap.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(postcss([
      autoprefixer(),
      cssnano(),
    ]))
    .pipe(rename('style.min.css'))
    .pipe(sourcemap.write('.'))
    .pipe(dest('build/css'))
    .pipe(browserSync.stream());
});

/* Copy and minify HTML */

task('html', () => {
  return src('src/*.html')
    .pipe(minify({ collapseWhitespace: true }))
    .pipe(dest('build'));
});

/* Create .webp images from .png and .jpg */

task('webp', () => {
  return src('src/img/**/*.{jpg,png}', {encoding: false})
    .pipe(webp({quality: 90}))
    .pipe(dest('build/img'));
});

/* Watch changes in files */

task('watch', () => {
  watch('src/sass/**/*.scss', series('styles'));
  watch('src/*.html', series('html'));
});

/* Empty build folder */

task('clean', (done) => {
  deleteSync('build');

  done();
});

/* Copy files from src to build */

task('copyFiles', (done) => {
  src([
    'src/fonts/**/*',
    'src/*.ico',
  ], {
    encoding: false,
    base: 'src',
  })
    .pipe(dest('build'));

  done();
});

/* Copy images from src to build */

task('copyImages', (done) => {
  src('src/img/**/*.{png,jpg}', {
    encoding: false,
  })
    .pipe(dest('build/img'))

  done();
});

/* Compress images for build */

task('optimizeImages', () => {
  return src('src/img/**/*.{png,jpg}')
    .pipe(sharpOptimizeImages({
      png_to_png: {
        quality: 80,
      },
      jpg_to_jpg: {
        quality: 80,
        mozjpeg: true,
      },
    }))
    .pipe(dest('build/img'))
});

/* Run main gulp task */

task('default', parallel('clean', 'copyFiles', 'copyImages', 'styles', 'html', 'webp', 'server', 'watch'));
task('build', parallel('clean', 'copyFiles', 'optimizeImages', 'styles', 'html', 'webp'));
