var DEFAULT_OPT = Object.freeze({
	method: "POST",
	url: "/",
	data: "",
	parseResponse: true,
		// determine if this module process the response json
		// true with http code 200, {errno: -1, errmsg: "error"}
		//      will call error()
		// false with http code 200, {errno: -1, errmsg: "error"}
		//      will call success()
	errcodeKey: "errno",
		// determine what's error code key
	contentType: true,
		// modify content-type header based on input
		// should turn to false if using FormData
	beforeSend: function() {},
	success: function() {},
	error: function() {},
	complete: function() {}
});

var params = {
	tearParams: function(search) {
		var str = search && search.replace(/^(\?|#)/, "");
		if (!str || str.length === 0) {
			return null;
		}
		return _.object(
			str.split("&").map(function(query) {
				var pivot = query.indexOf("=");
				var from = query.substr(0, pivot);
				var to = decodeURIComponent(
					query.substr(pivot + 1)
				);
				return [from, to];
			})
		);
	},
	makeParams: function(obj) {
		var strs = [];
		_.each(obj, function(val, key) {
			if (!_.isObject(val)) {
				strs.push(key + "=" + encodeURIComponent(val));
			} else {
				strs.push(key + "=" + encodeURIComponent(JSON.stringify(val)));
			}
		});
		return strs.join("&");
	}
};
var tearParams = params.tearParams;
var makeParams = params.makeParams;

function form2obj(form) {
	var obj = {};
	_.each(
		form.querySelectorAll("input, select, textarea"),
		function(elem) {
			if (/radio/i.test(elem.type)) {
				if (!elem.checked) {
					return;
				}
			}
			if (!elem.name) {
				return;
			}
			obj[elem.name] = elem.value;
		}
	);
	return obj;
}

function parseOption(opt) {
	var isRawBody = false;

	var domAnchor = document.createElement("a");
	domAnchor.href = opt.url;
	var urlRaw = domAnchor.origin + domAnchor.pathname;
	var urlParams = tearParams(domAnchor.search);
	var isUrlEncoded = false;

	var body = "";
	var formData = false;
	var data = opt.data;

	if (data instanceof FormData || data instanceof Blob) {
		formData = data;
	} else {
		if (/post/i.test(opt.method)) {
			var toAppend = "";
			if (_.isString(data)) {
				toAppend = data;
				isUrlEncoded = true;
			} else if (_.isElement(data)) {
				toAppend = makeParams(form2obj(data));
				isUrlEncoded = true;
			} else if (_.isObject(data)) {
				toAppend = makeParams(data);
				isUrlEncoded = true;
			}
			body += toAppend;
		} else if (/get/i.test(opt.method)) {
			if (_.isString(data)) {
				_.each(tearParams(data), function(val, key) {
					urlParams[key] = val;
				});
				data = null;
			} else if (_.isElement(data)) {
				_.extend(urlParams, form2obj(data))
				data = null;
			} else if (_.isObject(data)) {
				_.each(data, function(val, key) {
					urlParams[key] = val;
				});
				data = null;
			}
		}
	}

	opt.url = (urlRaw + "?" + makeParams(urlParams)).replace(/[&?]{1,2}/, '?');
	opt.data = data;
	opt.body = formData || body;

	if(!opt.contentType) {
		return;
	}

	if (formData) {
		opt.contentType = "multipart/form-data";
	} else if (isUrlEncoded) {
		opt.contentType = "application/x-www-form-urlencoded";
	}
}

module.exports = function(option) {
	var opt = _.defaults(option || {}, DEFAULT_OPT);
	parseOption(opt);

	var ajax = new XMLHttpRequest();

	ajax.addEventListener("readystatechange", function() {
		if (ajax.readyState !== 4) {
			return;
		}

		if (ajax.status >= 400 || ajax.status === 0) {
			opt.error.call(ajax, ajax.status);
			opt.complete.call(ajax);
			return;
		}

		if (ajax.status !== 200) {
			opt.complete.call(ajax);
			return;
		}

		if (!opt.parseResponse) {
			opt.success.call(ajax, ajax.response);
			opt.complete.call(ajax);
			return;
		}

		try {
			var rep = JSON.parse(ajax.response);
			var errKey = opt.errcodeKey;
			if (rep && rep[errKey] === 0) {
				opt.success.call(ajax, rep);
			} else {
				var msg = rep.errmsg || "`parseResponse` set to true, and in response, " + errKey + "(`errcodeKey` in option) nq 0"
				opt.error.call(ajax, rep[errKey], msg);
			}
		} catch (e) {
			opt.error.call(ajax, ajax.status);
		}
		opt.complete.call(ajax);
	});

	opt.beforeSend.call(ajax);
	ajax.open(opt.method, opt.url);
	opt.contentType && ajax.setRequestHeader("Content-Type", opt.contentType);
	ajax.send(opt.body);
};