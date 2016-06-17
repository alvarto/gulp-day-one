const PathReg = require('./class.path-reg'),
	_ = require("lodash"),
	findFiles = require('glob'),
	eventstream = require('event-stream');

function TaskPathMapper(from, to, overrides) {
	var pathFrom = new PathReg(from),
		pathTo = new PathReg(
			to,
			pathFrom.keys.map(function (key) {
				return key.name
			})
		);

	if (!(this instanceof TaskPathMapper)) {
		throw new TypeError("A path mapper must be newed");
	}

	_.extend(this, {
		from: from,
		to: to,
		pathFrom: pathFrom,
		pathTo: pathTo
	});
	_.extend(this, overrides);
}

TaskPathMapper.prototype.task = function (gulpBuildFn, callback) {
	var mapper = this;
	this.promiseSourceParse()
		.then(function (paramTable) {
			var tasks = paramTable.map(function (params) {
				return gulpBuildFn.apply(mapper, params);
			});
			if (!tasks || tasks.length < 2) {
				callback();
				return;
			}

			eventstream.merge(tasks)
				.on('end', callback);
		}, function (err) {
			callback(err);
		});
}

TaskPathMapper.prototype.curryTask = function (gulpBuildFn) {
	var mapper = this;
	return function (callback) {
		mapper.task(gulpBuildFn, callback);
	}
};

TaskPathMapper.prototype.promiseSourceParse = function () {
	var mapper = this;
	return promiseGlob(this.pathFrom.glob)
		.then(function (files) {
			var paramTable = files.map(function (entry) {
				var results = mapper.pathFrom.reg.exec(entry);
				return results;
			}).filter(function (elem) {
				if (!elem || elem.length < 2) {
					return false;
				}
				return true;
			}).map(function (elem) {
				var params = elem.slice();
				params.shift();
				var source = mapper.pathFrom.fill.apply(null, params);
				var destination = mapper.pathTo.fill.apply(null, params);

				return [source, destination].concat(params);
			});

			return paramTable;
		});
};

function promiseGlob(glob) {
	return new Promise(function (resolve, reject) {
		findFiles(glob, function (err, files) {
			if (err) {
				reject(err);
				return;
			}

			resolve(files);
		});
	});
}

module.exports = TaskPathMapper;