var gulp = require('gulp'),
	fs = require('fs'),
	$ = require('gulp-load-plugins')(),
	eventstream = require('event-stream');

var globs = require("./globs"),
	curryTask = require('./gulp-builder').curryTask;

var documentJade = 'bin/svg/svgdemo.jade';

module.exports = function(callback) {
	curryTask(
		globs.svg,
		function(source, destination, project) {
			var tasks = [];
			var files = fs.readdirSync(source.replace("**", ""));

			tasks.push(
				gulp.src(source)
				.pipe($.svgstore())
				.pipe(gulp.dest(destination))
			);

			tasks.push(
				gulp.src(documentJade)
				.pipe($.jade({
					data: {
						directory: project,
						arr: files
					}
				}))
				.pipe($.rename(project+'.html'))
				.pipe(gulp.dest(globs.svg.demoDist))
			);

			return eventstream.merge(tasks);
		}
	)(callback);
};