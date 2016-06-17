// globs definition
const path = require('path'),
	fs = require('fs'),
	_ = require("lodash"),
	TaskPathMapper = require('./class.task-path-mapper');

var folderManager = {};

folderManager.js = {
	module: { // third party js files, for copying
		source: 'asset/common/javascript/**/*.js',
		dist: 'destination/resource/module/'
	},
	nonModule: new TaskPathMapper( // first party js files, for copying
		'asset/:project/javascript/:jsname.js',
		'destination/resource/js/:project/'
	),
	build: new TaskPathMapper( // first party js files, for combining
		'javascript/:entry.js',
		'destination/resource/js/bundle/', {
			watch: 'javascript/**/*.js',
			fillSource: function(entry) {
				return `javascript/${entry}.js`;
			},
		}
	),
};

folderManager.bitmap = new TaskPathMapper(
	'asset/:project/bitmap/:sub*/:imgfile',
	'destination/resource/img/:project/:sub*/', {
		watch: 'asset/*/bitmap/**',
	}
);

folderManager.svg = new TaskPathMapper(
	'asset/:project/svg/:svgfile',
	'asset/:project/bitmap/v/', {
		demoDist: 'destination/resource/html/svg/',
	}
);

folderManager.sprite = new TaskPathMapper(
	'asset/:project/:type(sprite|sprite\.wap)/:sub?/',
	'asset/:project/bitmap/s/', {
		fillSource: function(project, type, sub) {
			return `asset/${project}/${type}/${sub || ""}`;
		},
		getLessDist: function (project) {
			return 'asset/' + project + '/less/s';
		},
		getImageLink: function (project, type, sub) {
			return '../../img/' + project + '/s/';
		},
	}
);

folderManager.groceries = new TaskPathMapper(
	'asset/:project/:type(html|other|font)/:others+',
	'destination/resource/:type/', {
		watch: 'asset/*/{html,other,font}/**',
	}
);

folderManager.less = new TaskPathMapper(
	'asset/:project/less/:entry.less',
	'destination/resource/css/:project/', {
		watch: '**/*.less',
		lessCommon: 'asset/common/less',
		includeImgCommon: 'asset/common/bitmap',
	}
);

folderManager.font = {
	source: '/**/*.jade',
	dist: 'asset/site.desktop/font/',
};

folderManager.views = {
	main: [
		'asset/*/jade/*.jade',
		'!asset/common/jade/*.jade',
		'!asset/*/jade/frame.*.jade',
	],
	watch: 'asset/**/*.jade',
	base: './asset/common/jade/',
	dist: 'destination/'
};

folderManager.del = {
	frontend: [
		'.cache/**',
		'destination/**',
		'test/**',
		'document/**',
	],
	font: 'asset/site.desktop/font/*',
	svg: [
		'asset/*/bitmap/v/**',
	],
	sprite: [
		'asset/*/{bitmap,less}/s/**',
		'bin/.tmp/**',
	],
};

module.exports = folderManager;
