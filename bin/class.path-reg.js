const pathRegexp = require('path-to-regexp');

function PathReg(path, preferedArgsList) {
	var keys = [];
	var regexp = pathRegexp(path, keys);

	if (!(this instanceof PathReg)) {
		throw new TypeError("A path reg must be newed");
	}

	this.original = path;
	this.keys = keys;
	this.reg = regexp;
	this.glob = "";
	this.templateStr = "";

	var that = this;

	var pathSegArr = path.split("/");
	pathSegArr.forEach(function (pathSeg, index) {
		var theKey = false,
			keyPos = -1;
		keys.forEach(function (key, index) {
			if(pathSeg.indexOf(":" + key.name) > -1){
				theKey = key.name;
				keyPos = index;
			}
		});

		if (theKey) {
			if (RegExp(`:${theKey}[*?+]`).test(pathSeg)) {
				that.glob += "**";
				that.templateStr += "${" + `Array.isArray(${theKey}) ? ${theKey}.join('/') : ${theKey}` + " || ''}";
			} else {
				that.glob += "*";
				that.templateStr += "${" + `${theKey}` + "}";
			}
		} else {
			that.glob += pathSeg;
			that.templateStr += pathSeg;
		}

		if (index < pathSegArr.length - 1) {
			that.glob += "/";
			that.templateStr += "/";
		}
	});

	this.templateStr = "`" + this.templateStr + "`";

	var fnarg = Array.isArray(preferedArgsList) ?
		preferedArgsList : keys.map(function (key) {
			return key.name;
		});
	fnarg.push("return " + this.templateStr);
	this.fill = Function.apply(null, fnarg);

	// this.compile = pathRegexp.compile(path);
}

module.exports = PathReg;