const gulp = require('gulp');
require('gulp-stats')(gulp);// collates task stats

const del = require('del');
const rollup = require('rollup-stream');
const includePaths = require('rollup-plugin-includepaths');
const resolve = require('rollup-plugin-node-resolve');
const source = require('vinyl-source-stream');
const mocha = require('gulp-mocha');
const sequence = require('run-sequence');
const bump = require('gulp-bump');
const tag_version = require('gulp-tag-version');
const git = require('gulp-git');
const exec = require('child_process').exec;


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
            extensions: ['.js', '.mjs']
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

gulp.task('bump', () => gulp.src(['./package.json'])
    .pipe(bump({
        type: 'patch',
    }))
    .pipe(gulp.dest('./')));

const getPackageJson = () => JSON.parse(fs.readFileSync('./package.json', 'utf8'));

gulp.task('bumpCache', () => {
    const {version} = getPackageJson();
    return git.add()
        .pipe(git.commit('bumps package version'))
        .pipe(tag_version({version}));
});

gulp.task('pushTags', (cb) => {
    exec('git push --tags', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});

gulp.task('updateVersion', done => {
    return sequence('bump', 'bumpCache', 'pushTags', done);
});

gulp.task('publish', ['default', 'updateVersion'], (cb) => {
    exec('npm publish ./', (err, stdout, stderr) => {
        console.log(stdout);
        console.log(stderr);
        cb(err);
    });
});
gulp.task('default', ['test', 'client']);