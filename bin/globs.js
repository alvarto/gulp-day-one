/* global process */

// globs definition
var path = require('path');
var fs = require('fs');

var folderManager = {
	js: {
		module: { // third party
			source: 'asset/common/**/*.js',
			dist: 'destination/resource/module/'
		},
		nonModule: { // 拷贝用脚本
			watch: 'asset/*/javascript/*.js',
			source: 'asset/*/javascript/',
			sourceID: 'asset/:project/javascript/',
			getSource: function(project) {
				return `asset/${project}/javascript/*.js`;
			},
			getDist: function(project) {
				return `destination/resource/js/${project}`;
			}
		},
		build: { // 编译用脚本
			watch: 'javascript/bundle/**/*.js',
			source: 'javascript/bundle/*.js',
			sourceID: 'javascript/bundle/:entry',
			getSource: function(entry) {
				return 'javascript/bundle/' + entry;
			},
			dist: 'destination/resource/js/bundle',
		},
	},
	css: { // 样式
		less: [
			'asset/*/less/*.less',
			'!asset/common/less/*.less',
			'!asset/*/less/frame.*',
			'!asset/*/less/mixin.*',
		],
		dist: 'destination/resource/css',
		watch: '**/*.less',
		lessCommon: path.resolve(process.cwd(), 'asset/common/less'),
		includeImgCommon: path.resolve(process.cwd(), 'asset/common/bitmap'),
	},
	views: { // 视图
		main: [
			'asset/*/jade/*.jade',
			'!asset/common/jade/*.jade', // 刨除通用页的渲染
			'!asset/*/jade/frame.*.jade', // 刨除框架页的渲染
			'!**/*.tpl.jade', // 刨除jade-tpl转换器
		],
		activity: [
			'asset/*/jade.activity/*.jade',
			'!asset/common/jade.activity/*.jade', // 刨除通用页的渲染
			'!asset/*/jade.activity/frame.*.jade', // 刨除框架页的渲染
			'!**/*.tpl.jade', // 刨除jade-tpl转换器
		],
		jade2tpl: 'asset/**/*.tpl.jade', // jade-tpl转换器
		watch: 'asset/**/*.jade',
		base: './asset/common/jade/',
	},
	bitmap: { // 位图
		source: 'asset/*/bitmap',
		sourceID: 'asset/:project/bitmap',
		getSource: function(project, file) {
			return 'asset/' + project + '/bitmap/**';
		},
		getDist: function(project, file) {
			if (project === 'demo') {
				return 'destination/resource/img';
			}
			return 'destination/resource/img/' + project;
		},
		watch: 'asset/*/bitmap/**',
	},
	svg: { // 可缩放图像雪碧图
		source: 'asset/*/svg/',
		sourceID: 'asset/:project/svg',
		getSource: function(project) {
			return 'asset/' + project + '/svg/**';
		},
		getDist: function(project) {
			return 'asset/' + project + '/bitmap/v/';
		},
		demoDist: 'destination/resource/html/svg/',
	},
	sprite: { // 位图雪碧图
		source: 'asset/*/{sprite,sprite.wap}/**/',
		sourceID: 'asset/:project/:type(sprite|sprite\.wap)/:sub?',
		getSource: function(project, type, sub) {
			return ['asset', project, type, sub || ''].join('/');
		},
		getDist: function(project) {
			return 'asset/' + project + '/bitmap/s';
		},
		getLessDist: function(project) {
			return 'asset/' + project + '/less/s';
		},
		getImageLink: function(project, type, sub) {
			return '/resource/img/' + project + '/s/';
		},
		md5Base: 'bin/.tmp/',
		compiledSource: 'asset/*/bitmap/s/**',
		compiledDist: 'destination/resource/img/sprites',
	},
	groceries: { // 杂项
		watch: 'asset/*/{html,other,font}/**',
		source: 'asset/*/{html,other,font}',
		sourceID: 'asset/:project/:type',
		getSource: function(project, type) {
			return 'asset/' + project + '/' + type + '/**';
		},
		getDist: function(project, type) {
			return 'destination/resource/' + type;
		},
	},
	font: { // 字体子集
		source: 'asset/{site.desktop-badilong/jade/*.jade,site.desktop/jade/!(faq).jade,common/jade/*.jade}',
		dist: 'asset/site.desktop/font/',
	},
	dist: 'destination', // 整体编译目标，前端本地测试环境
	del: { // 清除任务
		frontend : [
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
	},
	backend: {}, // 对应真正后端环境
	deploy: { // 到后端环境的测试环境文件映射
		tpl: 'destination/*.tpl',
		html: 'destination/*.html', // 目标HTML
		binaryGroceries: 'destination/resource/{img,font,other}/**', // 二进制资源文件，不进行EOL变换
		textGroceries: [ // 非二进制资源文件，进行EOL变换
			'destination/resource/**',
			'!destination/resource/{img,font,other}/**',
			'!**/*.map',
		]
	},
	test: { // 测试/文档相关
		js: {
			source: 'javascript/bundle/lib/*.js',
			sourceID: 'javascript/bundle/lib/:module.:name.js',
			getSource: function(module, name) {
				return 'javascript/bundle/lib/' + module + '.' + name + '.js';
			},
			dist: 'document/resource/js',
		},
		css: {
			source: 'asset/common/less/**/*.less',
			dist: 'document/resource/css'
		},
		view: {
			source: [
				'javascript/test/**/*.jade',
				'!javascript/test/_legacy/**',
				'!javascript/test/frame/**',
				'!javascript/test/widget/**',
				'!javascript/test/live/**',
				'!javascript/test/index/**',
			],
			dist: 'document',
			sourceWidget: 'javascript/test/widget/*.jade',
			distWidget: 'document/widget',
			basePath: 'javascript/test',
		},
		api: {
			source: 'javascript/test/api/*.jade',
			sourceID: 'javascript/test/api/:name.jade',
		},
		img: {
			source: 'bin/test/img/**',
			dist: 'document/resource/img/',
		},
		groceries: {
			source: [
				'bin/test/groceries/**',
				'bin/test/main/**'
			],
			dist: 'document/resource/',
		},
		watch: [
			'bin/test/**',
			'javascript/bundle/lib/**',
			'javascript/test/**',
			'asset/common/less/**',
		],
		otherModule: 'javascript/module/',
		animations: 'asset/common/less/animation/',
		widgets: 'javascript/test/widget/',
	},
};

module.exports = Object.freeze(folderManager);

module.exports.globOf = function(str) {
	
};