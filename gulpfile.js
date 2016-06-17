// gulp part
const gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	runsequence = require("run-sequence");

// project sub modules
const globs = require("./bin/globs"),
	clean = require('./bin/gulp-clean');

// browserify part
const browserify = require('browserify'),
	sourceStream = require('vinyl-source-stream');

// simple build/copy tasks without namespace
gulp.task('module:copy', function () {
	return gulp.src(globs.js.module.source)
		.pipe(gulp.dest(globs.js.module.dist));
});

gulp.task('jade:build', function (callback) {
	var tasks = [];
	var jadeOpt = {
		pretty: '\t',
		basedir: globs.views.base,
	};

	return gulp.src(globs.views.main)
		.pipe($.plumber())
		.pipe($.jade(jadeOpt))
		.pipe($.plumber.stop())
		.pipe($.flatten())
		.pipe(gulp.dest(globs.views.dist))
});

// build tasks with namespace
gulp.task('less:build', function (callback) {
	globs.less.task(
		function (source, destination, project, sub) {
			if (project === 'common') {
				return null;
			}

			return gulp.src(source)
				.pipe($.plumber({
					errorHandler: callback
				}))
				.pipe($.less({
					paths: [
						'.', globs.less.lessCommon, globs.less.includeImgCommon
					]
				}))
				.pipe($.flatten())
				.pipe($.plumber.stop())
				.pipe(gulp.dest(destination));
		},
		callback
	);
});

gulp.task('js:copy', globs.js.nonModule.curryTask(
	function (source, destination, project) {
		if (project === 'common') {
			return null;
		}
		return gulp.src(source)
			.pipe(gulp.dest(destination));
	}
));

gulp.task('js:compile', function (callback) {
	globs.js.build.task(
		function (source, destination) {
			return browserify({
				entries: [source]
			})
				.bundle()
				.on('error', callback)
				.pipe(sourceStream(source))
				.pipe($.flatten())
				.pipe(gulp.dest(destination));
		},
		callback
	);
});

gulp.task('images:copy', globs.bitmap.curryTask(
	function (source, destination, project) {
		if (project === "common") {
			return null;
		}
		return gulp.src(source)
			.pipe(gulp.dest(destination));
	}
));

gulp.task('groceries:copy', globs.groceries.curryTask(
	function (source, destination) {
		return gulp.src(source, {
			buffer: false,
		})
			.pipe(gulp.dest(destination));
	}
));

// gulp tasks for commandline
gulp.task('clean', function (callback) {
	clean(globs.del.frontend, 'frontend', callback);
});

gulp.task('clean:sprite', function (callback) {
	clean(globs.del.sprite, 'sprite', callback);
});

gulp.task('clean:font', function (callback) {
	clean(globs.del.font, 'sprite', callback);
});

// gulp.task('clean:svg', function (callback) {
// 	clean(globs.del.svg, 'sprite', callback);
// });

// preprocesser
gulp.task('sprite', require('./bin/gulp-sprite'));
gulp.task('font', require('./bin/gulp-font'));
// gulp.task('svg', require('./bin/gulp-svg'));

// watch related gulp tasks
gulp.task('build', [
	'jade:build',
	'js:copy',
	'js:compile',
	'images:copy',
	'module:copy',
	'less:build',
	'groceries:copy',
]);

gulp.task('watch', ['build'], function (callback) {
	var changedArr = [];

	function push(s) {
		changedArr.push(s);
	}

	function pop() {
		while (changedArr.length > 0) {
			var s = changedArr.pop();
			$.livereload.changed(s);
		}
	}

	gulp.watch(globs.views.watch, ['jade:build', pop]);

	gulp.watch(globs.less.watch, ['less:build', pop])
		.on('change', push);

	gulp.watch(globs.groceries.watch, ['groceries:copy', pop])
		.on('change', push);

	gulp.watch(globs.js.module.watch, ['module:copy', pop])
		.on('change', push);

	gulp.watch(globs.js.nonModule.watch, ['js:copy', pop])
		.on('change', push);

	gulp.watch(globs.js.build.watch, ['js:compile', pop])
		.on('change', push);

	gulp.watch(globs.bitmap.watch, ['images:copy', pop])
		.on('change', push);

	$.livereload.listen();

	callback();
});

// and the default
gulp.task('default', ['watch']);