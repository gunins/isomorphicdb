const gulp = require('gulp');
require('gulp-stats')(gulp);// collates task stats

const del = require('del');
const rollup = require('rollup-stream');
const includePaths = require('rollup-plugin-includepaths');
const forceBinding = require('rollup-plugin-force-binding');
const resolve = require('rollup-plugin-node-resolve');
const source = require('vinyl-source-stream');
const mocha = require('gulp-mocha');
const sequence = require('run-sequence');

const rollupStream = require('./build/gulp/plugins/rollupStream');

const include = {
    'functional/core/Task':   './node_modules/functional_tasks/src/functional/core/Task',
    'functional/core/Match':  './node_modules/functional_tasks/src/functional/core/Match',
    'functional/core/Option': './node_modules/functional_tasks/src/functional/core/Option',
    'functional/async/Fetch': './node_modules/functional_tasks/src/functional/async/Fetch'
};

const fBinding = [
    './node_modules/functional_tasks/src/functional/core/Task',
    './node_modules/functional_tasks/src/functional/core/Match',
    './node_modules/functional_tasks/src/functional/core/Option',
    'match',
    'some',
    'none',
    'Task',
];


gulp.task('clean', () => {
    return del([
        './dist',
        './target'
    ]);
});

gulp.task('client',['clean'], () => rollup({
    input:   './src/index.js',
    format:  'iife',
    name:    'isomorpicDB',
    plugins: [
        forceBinding(fBinding),
        resolve({
            browser: true
        }),
        includePaths({
            include,
            extensions: ['.js']
        })]
}).pipe(source('index.js'))
    .pipe(gulp.dest(`./dist`)));

gulp.task('runTest', () => {
    process.env.NODE_ENV = 'test';
    return gulp.src([
        './target/**/*.js'
    ], {read: false})
        .pipe(mocha({reporter: 'spec'}));

});
gulp.task('rollupTest', () => {
    return gulp.src('./test/**/*.js', {read: false})
        .pipe(rollupStream('/test/', false, 'cjs', {fBinding, include}))
        .pipe(gulp.dest('./target'));
});

gulp.task('test', done => {
    sequence('rollupTest', 'runTest', done);
});

gulp.task('default',['client']);