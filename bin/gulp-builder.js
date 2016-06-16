var findFiles = require('glob'),
	eventstream = require('event-stream'),
	getPathMatchReg = require('path-to-regexp');

function curryTask(globObj, buildGulp) {
	return function(callback) {
		promiseGlobParse(globObj)
			.then(function(paramTable) {
				var tasks = paramTable.map(function(params) {
					return buildGulp.apply(globObj, params);
				});
				if (!tasks || tasks.length < 2) {
					callback();
					return;
				}

				eventstream.merge(tasks)
					.on('end', callback);
			}, function(err) {
				callback(err);
			});
	}
}

function promiseGlobParse(globObj) {
	var matcher = getPathMatchReg(globObj.sourceID);
	return new Promise(function(resolve, reject) {
		findFiles(globObj.source, function(err, files) {
			if (err) {
				reject(err);
				return;
			}

			var paramTable = files.map(function(entry) {
				var results = matcher.exec(entry);
				return results;
			}).filter(function(elem) {
				if (!elem || elem.length < 2) {
					return false;
				}
				return true;
			}).map(function(elem) {
				var params = elem.slice();
				params.shift();
				var source = typeof globObj.getSource === "function" ?
					globObj.getSource.apply(globObj, params) : globObj.source;
				var destination = typeof globObj.getDist === "function" ?
					globObj.getDist.apply(globObj, params) : globObj.dist;

				return [source, destination].concat(params);
			});

			resolve(paramTable);
		});
	});
}

module.exports = {
	curryTask: curryTask,
	globParse: promiseGlobParse
};