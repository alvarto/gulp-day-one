// gulp part
var gulp = require('gulp'),
	$ = require('gulp-load-plugins')(),
	fs = require('fs'),
	runsequence = require("run-sequence"),
	exec = require('child_process').exec,
	eventstream = require('event-stream');

// project sub modules
var globs = require("./bin/globs"),
	clean = require('./bin/gulp-clean'),
	curryTask = require('./bin/gulp-builder').curryTask;

// browserify part
var browserify = require('browserify'),
	sourceStream = require('vinyl-source-stream');

// simple build/copy tasks
gulp.task('module:copy', function() {
	return gulp.src(globs.js.module.source)
		.pipe(gulp.dest(globs.js.module.dist));
});

gulp.task('js:copy', curryTask(
	globs.js.nonModule,
	function(source, destination) {
		return gulp.src(source)
			.pipe(gulp.dest(destination));
	}
));

gulp.task('less:build', function(callback) {
	return gulp.src(globs.css.less)
		.pipe($.plumber({
			errorHandler: callback
		}))
		.pipe($.less({
			paths: [
				'.', globs.css.lessCommon, globs.css.includeImgCommon
			]
		}))
		.pipe($.flatten())
		.pipe($.plumber.stop())
		.pipe(gulp.dest(globs.css.dist));
});

gulp.task('jade:build', function(callback) {
	var tasks = [];
	var jadeOpt = {
		pretty: '\t',
		basedir: globs.views.base,
	};

	gulp.src(globs.views.main)
		.pipe($.plumber())
		.pipe($.jade(jadeOpt))
		.pipe($.plumber.stop())
		.pipe($.flatten())
		.pipe(gulp.dest(globs.views.dist))

	eventstream.merge(tasks)
		.on('end', callback);
});

// build tasks with namespace
gulp.task('js:compile', function(callback) {
	curryTask(
		globs.js.build,
		function(source, destination) {
			return browserify({
					entries: [source]
				})
				.bundle()
				.on('error', callback)
				.pipe(sourceStream(source))
				.pipe($.flatten())
				.pipe(gulp.dest(destination));
		}
	)(callback);
});

gulp.task('images:copy', curryTask(
	globs.bitmap,
	function(source, destination) {
		return gulp.src(source)
			.pipe(gulp.dest(destination));
	}
));

gulp.task('groceries:copy', curryTask(
	globs.groceries,
	function(source, destination) {
		return gulp.src(source, {
				buffer: false,
			})
			.pipe(gulp.dest(destination));
	}
));

// gulp tasks for commandline
gulp.task('clean:frontend', function(callback) {
	clean(globs.del.frontend, 'frontend', callback);
});

gulp.task('clean:sprite', function(callback) {
	clean(globs.del.sprite, 'sprite', callback);
});

gulp.task('clean:font', function(callback) {
	clean(globs.del.font, 'sprite', callback);
});

gulp.task('clean:svg', function(callback) {
	clean(globs.del.svg, 'sprite', callback);
});

gulp.task('clean', [
	'clean:frontend',
	'clean:sprite',
	'clean:font',
	'clean:svg',
]);

// preprocesser
gulp.task('sprite', require('./bin/gulp-sprite'));
gulp.task('font', require('./bin/gulp-font'));
gulp.task('svg', require('./bin/gulp-svg'));

gulp.task('pre', ['sprite', 'font', 'svg']);

// a good task which runs them all
gulp.task('refresh', function(callback) {
	runsequence(
		'clean', // clean all autocommitted stuff
		'pre', // precompile 
		'build', // build and set up backend & test env
		'deploy', // deploy to backend
		callback
	);
});

// watch related gulp tasks
gulp.task('build', [
	'jade:build',
	'js:copy',
	'js:compile',
	'images:copy',
	'module:copy',
	'less:build',
	'groceries:copy',
	'test'
]);

gulp.task('html:change', function() {
	return gulp.src(globs.deploy.html)
		.pipe($.changed('.cache', {
			hasChanged: $.changed.compareSha1Digest
		}))
		.pipe(gulp.dest('.cache'))
		.pipe($.livereload());
});

gulp.task('watch', ['build'], function(callback) {
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

	gulp.watch(globs.views.watch, ['jade:build']);
	gulp.watch(globs.deploy.html, ['html:change']);

	gulp.watch(globs.css.watch, ['less:build', pop])
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