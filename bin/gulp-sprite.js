var fs = require('fs'),
	exec = require('child_process').exec,
	path = require('path'),
	_ = require('lodash');

var parsePath = require('./gulp-builder').globParse,
	globs = require("./globs"),
	str = require('./string');

var commandDesktop = str.buildConsole(['glue', '%s', '%s', '--less=%s'], {
		margin: 4,
		namespace: 's',
		'sprite-namespace': ' ',
		url: '%s',
		'less-template': 'bin/sprite/less.jinja',
		// 'less': ' '
	}),
	commandWap = commandDesktop + " --retina";

module.exports = function(callback) {
	var statusObj = fileStatus(),
		preStatus = statusObj.read(),
		curStatus = {},
		pathObj = _.cloneDeep(globs.sprite);

	if (process.argv.indexOf("--p") > -1) {
		// gulp sprite --p xxFolder -> ['node', 'path/to/gulp.js', 'sprite', '--p', 'xxFolder']
		var filteredFolder = process.argv[process.argv.indexOf("--p") + 1];
		pathObj.source = pathObj.source.replace("*", filteredFolder);
	}

	parsePath(pathObj)
		.then(function(paramTable) {
			return Promise.all(paramTable.map(function(params) {
				return getFolderStat.apply(null, params);
			}));
		})
		.then(function(folderStatTable) {
			var promises = folderStatTable
				.filter(function(params) {
					return filterModified.apply(null, params);
				})
				.map(function(params) {
					return manufacture.apply(null, params);
				});
			return Promise.all(promises)
		})
		.then(function(arr) {
			console.log(
				"Sprites:\t%d successed\n\t\t%d modified\n\t\t%d total.",
				arr.reduce(function(prev, cur) {
					return prev + cur;
				}),
				arr.length,
				Object.keys(curStatus).length
			);
			console.log(
				"Run gulp clean:sprite before this to recreate all."
			);

			// statusObj.write(curStatus);
			callback();
		}, callback);

	function filterModified(source, destination, project, type, sub) {
		if (!preStatus[source] || curStatus[source] > preStatus[source]) {
			return true;
		}
		return false;
	}

	function manufacture(source, destination, project, type, sub) {
		var command = {},
			less = globs.sprite.getLessDist(project),
			imgLink = globs.sprite.getImageLink(project, type, sub);
		if (type === 'sprite.wap') {
			command = str.sprintf(commandWap, source, destination, less, imgLink);
		} else {
			command = str.sprintf(commandDesktop, source, destination, less, imgLink);
		}

		return execPromise(command)
			.then(function() {
				console.log("Done in path\t" + source);
				return 1;
			}, function(err) {
				console.error("Error in path\t" + source);
				// console.error(err);
				return 0;
			});
	}

	function getFolderStat(source, destination, project, type, sub) {
		return new Promise(function(resolve, reject) {
			fs.stat(source, function(err, stat) {
				if (err) {
					reject(err);
					return;
				}

				curStatus[source] = +stat.mtime;
				resolve([source, destination, project, type, sub]);
			});
		});
	}
};

function fileStatus() {
	if (!fs.existsSync(globs.sprite.md5Base)) {
		fs.mkdirSync(globs.sprite.md5Base);
	}

	var md5FilePath = globs.sprite.md5Base + 'sprites.md5';
	return Object.freeze({
		read: function() {
			var lastFolders = {};
			try {
				var jsonFile = fs.readFileSync(md5FilePath);
				lastFolders = JSON.parse(jsonFile);
			} catch (exc) {}
			return lastFolders;
		},
		write: function(curFolders) {
			fs.writeFileSync(md5FilePath, JSON.stringify(curFolders));
		}
	});
}

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