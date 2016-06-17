const gulp = require('gulp'),
	fs = require('fs'),
	$ = require('gulp-load-plugins')(),
	eventstream = require('event-stream'),
	svgMapper = require("./globs").svg,
	documentJade = 'bin/svg/svgdemo.jade';

module.exports = function (callback) {
	svgMapper.task(
		function (source, destination, project) {
			console.log(source, destination);
			var tasks = [];
			var files = fs.readdirSync(source.replace("*", ""));

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
					.pipe($.rename(project + '.html'))
					.pipe(gulp.dest(svgMapper.demoDist))
			);

			return eventstream.merge(tasks);
		},
		callback
	);
};