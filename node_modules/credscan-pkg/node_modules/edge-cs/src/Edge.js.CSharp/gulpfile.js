/// <binding AfterBuild='copy' />
/*
This file in the main entry point for defining Gulp tasks and using Gulp plugins.
Click here to learn more. http://go.microsoft.com/fwlink/?LinkId=518007
*/

var gulp = require('gulp');
var path = require('path');

gulp.task('copy', function () {
    gulp.src('../../artifacts/bin/edge-cs-coreclr/Release/dnxcore50/edge-cs-coreclr.dll').pipe(gulp.dest('../../lib/edge-cs-coreclr'));
    gulp.src('./project.json').pipe(gulp.dest('../../lib/edge-cs-coreclr'));
});