const gulp = require('gulp');
require('gulp-stats')(gulp);// collates task stats

const del = require('del');
const rollup = require('rollup-stream');
const includePaths = require('rollup-plugin-includepaths');
const resolve = require('rollup-plugin-node-resolve');
const source = require('vinyl-source-stream');



gulp.task('clean', () => {
    return del([
        './target'
    ]);
});

gulp.task('client', ['clean'], () => rollup({
    input:   './client.mjs',
    format:  'umd',
    name:    'generic',
    plugins: [
        resolve({
            browser: true
        }),
        includePaths({
            // include,
            extensions: ['.js','.mjs']
        })]
}).pipe(source('index.js'))
    .pipe(gulp.dest(`./target`)));






gulp.task('default', ['client']);