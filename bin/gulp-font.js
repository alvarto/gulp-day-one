var fs = require("fs"),
	path = require("path"),
	findFiles = require("glob"),
	sprintf = require("util").format,
	exec = require('child_process').exec,
	_ = require("lodash");

var COMMANDS = {
	"eot": "-e -x",
	"woff": "-w",
	"ttf": "",
};

var projectRoot = process.cwd(),
	glob = require("./globs").font,
	sourceFontPath = path.resolve(projectRoot, "bin/font/fz-l.ttf"),
	jarPath = path.resolve(projectRoot, "bin/font/sfnttool.jar"),
	preCommand = "java -jar " + jarPath,
	postCommand = sprintf("%s %sfz-l-sub.", sourceFontPath, glob.dist);

module.exports = function(callback) {
	findFiles(glob.source, {}, function(err, files) {
		if (err) {
			callback(err);
			return;
		}
		console.log("Detected Files:\t" + files.length);

		var str = "";
		var promises = files.map(function(file) {
			return readFilePromise(file)
				.then(function(newstr) {
					str += newstr;
				});
		});
		Promise.all(promises).then(function() {
				return makeFont(str);
			})
			.then(function() {
				callback();
			}, callback);
	});
};

function readFilePromise(file) {
	return new Promise(function(resolve, reject) {
		fs.readFile(file, function(err, data) {
			if (err) {
				throw new Error(err);
			}
			resolve(data.toString());
		});
	});
}

function execPromise(cmd) {
	return new Promise(function(resolve, reject) {
		exec(cmd, function(err, stdout, stderr) {
			if (err) {
				reject(stderr);
				throw new Error(err);
			}
			resolve();
		});
	});
}

function makeFont(str) {
	var charArr = str.replace(/[^\u4e00-\u9fa5\uF900-\uFA2D\uFF01-\uFF5E\u3002\w]/g, "").split("").sort();
	var obj = {};
	for (var i = 0; i < charArr.length; i++) {
		obj[charArr[i]] = true;
	}
	charArr = Object.keys(obj);
	var usedStr = charArr.join("");
	console.log("Found chars:\t" + usedStr.length)
	console.log("Char list:\n\t" + usedStr);
	var midCommand = "-s \"" + usedStr + "\"";
	var promises = [];
	_.each(COMMANDS, function(fmtCommand, fmt) {
		var curcommand = [preCommand, fmtCommand, midCommand, postCommand + fmt].join(" ");
		var promise = execPromise(curcommand).then(function() {
			console.log('Made font:\tfz-l-sub.' + fmt);
		}, function(stderr) {
			console.log('Error making font:\tfz-l-sub.' + fmt + "\n" + stderr);
		});
		promises.push(promise);
	});
	return Promise.all(promises).then(function() {
		console.log("All done.");
	});
}