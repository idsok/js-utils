var fs = require("fs");
var path = require('path');
var gulp = require('gulp');
var del = require('del');
var ts = require('gulp-typescript');
var runSequence = require('run-sequence');

let options = {
    distDir: "./dist",
    srcDir: "./src"
};

gulp.task('clean', () => { return del([options.distDir]); });

gulp.task('ts', () => {
    var tsProject = ts.createProject(path.resolve('./tsconfig.json'));
    var tsResult = gulp.src(path.resolve(options.srcDir + '/**/*.ts')).pipe(tsProject());
    return tsResult.js.pipe(gulp.dest(path.resolve(options.distDir)));
});

gulp.task('copy', () => {
    return gulp.src(options.srcDir + '/**/*.json').pipe(gulp.dest(path.resolve(options.distDir)));
});

gulp.task('build', (done) => {
    runSequence('clean', 'copy', 'ts', done);
});

gulp.task('default', ['build']);