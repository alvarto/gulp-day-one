const exec = require('child_process').exec,
	_ = require('lodash'),
	globs = require("./globs"),
	sprintf = require("util").format;

var commandDesktop = buildConsole(['glue', '%s', '%s', '--less=%s'], {
		margin: 4,
		namespace: 's',
		'sprite-namespace': ' ',
		url: '%s',
		'less-template': 'bin/sprite/less.jinja',
		// 'less': ' '
	}),
	commandWap = commandDesktop + " --retina";

module.exports = function(callback) {
	var mapper = _.cloneDeep(globs.sprite);

	// if (process.argv.indexOf("--p") > -1) {
	// 	// gulp sprite --p xxFolder -> ['node', 'path/to/gulp.js', 'sprite', '--p', 'xxFolder']
	// 	var filteredFolder = process.argv[process.argv.indexOf("--p") + 1];
	// 	mapper.globSource = mapper.globSource.replace("*", filteredFolder);
	// }

	mapper.promiseSourceParse()
		.then(function(paramTable) {
			return Promise.all(paramTable.map(function(params) {
				return manufacture.apply(null, params);
			}));
		})
		.then(function(arr) {
			console.log(
				"Sprites:\t%d successed\n\t\t%d total.",
				arr.reduce(function(prev, cur) {
					return prev + cur;
				}),
				arr.length
			);
			console.log(
				"Run gulp clean:sprite before this to recreate all."
			);
			callback();
		}, callback);

	function manufacture(source, destination, project, type, sub) {
		var command = {},
			less = globs.sprite.getLessDist(project),
			imgLink = globs.sprite.getImageLink(project, type, sub);
		if (type === 'sprite.wap') {
			command = sprintf(commandWap, source, destination, less, imgLink);
		} else {
			command = sprintf(commandDesktop, source, destination, less, imgLink);
		}

		return execPromise(command)
			.then(function() {
				console.log("Done in path\t" + source);
				return 1;
			}, function(err) {
				console.error("Error in path\t" + source);
				return 0;
			});
	}
};

function execPromise(command) {
	return new Promise(function(resolve, reject) {
		exec(command, function(error, stdout, stderr) {
			if (error !== null) {
				reject(error);
				return;
			}
			resolve(stdout);
		});
	});
}

function buildConsole(params, options) {
	var str = params.join(" ");
	for (var key in options) {
		var val = options[key];
		if (!val) {
			str += ` --${key}`;
		} else {
			str += ` --${key}=${val}`;
		}
	}
	return str;
}