const gulp = require('gulp');
require('gulp-stats')(gulp);// collates task stats

const del = require('del');
const rollup = require('rollup-stream');
const includePaths = require('rollup-plugin-includepaths');
const resolve = require('rollup-plugin-node-resolve');
const source = require('vinyl-source-stream');
const mocha = require('gulp-mocha');
const sequence = require('run-sequence');

const rollupStream = require('./build/gulp/plugins/rollupStream');


gulp.task('clean', () => {
    return del([
        './dist',
        './target'
    ]);
});

gulp.task('client', ['clean'], () => rollup({
    input:   './src/index.js',
    format:  'umd',
    name:    'isomorpicDB',
    plugins: [
        resolve({
            browser: true
        }),
        includePaths({
            // include,
            extensions: ['.js']
        })]
}).pipe(source('index.js'))
    .pipe(gulp.dest(`./dist`)));

gulp.task('runTest', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src([
        './target/**/*.js'
    ], {read: false})
        .pipe(mocha({reporter: 'spec', exit: true}))

});
gulp.task('rollupTest', () => {
    return gulp.src('./test/**/*.js', {read: false})
        .pipe(rollupStream('/test/', false, 'cjs'))
        .pipe(gulp.dest('./target'));
});

gulp.task('test', done => {
    sequence('clean', 'rollupTest', 'runTest', done);
});

gulp.task('default', ['test', 'client']);