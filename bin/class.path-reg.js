var pathRegexp = require('path-to-regexp');

function PathReg(path, preferedArgsList) {
	var keys = [];
	var regexp = pathRegexp(path, keys);

	if (!(this instanceof PathReg)) {
		throw new TypeError("A path reg must be newed");
	}

	this.original = path;
	this.keys = keys;
	this.glob = "";
	this.templateStr = "";
	this.reg = regexp;

	var that = this;

	var pathSegArr = path.split("/");
	pathSegArr.forEach(function (pathSeg, index) {
		var theKey = false;
		keys.forEach(function (key) {
			pathSeg.indexOf(":" + key.name) === 0 && (theKey = key.name);
		});

		if (theKey) {
			that.glob += "*";
			that.templateStr += "${" + theKey + "}";
		} else {
			that.glob += pathSeg;
			that.templateStr += pathSeg;
		}

		if (index < pathSegArr.length - 1) {
			that.glob += "/";
			that.templateStr += "/";
		}
	});

	this.templateStr = "`" + that.templateStr + "`";

	var fnarg = Array.isArray(preferedArgsList) ?
		preferedArgsList : keys.map(function (key) {
			return key.name;
		});
	fnarg.push("return " + this.templateStr);
	this.fill = Function.apply(null, fnarg);

	this.compile = pathRegexp.compile(path);
}

module.exports = PathReg;