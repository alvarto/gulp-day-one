var del = require('del');

module.exports = function(glob, name, callback) {
	del(glob, {
		force: true
	}).then(function(paths) {
		console.log(`${name} files cleaned.\nTotal:\t${paths.length}`);
		callback();
	}).catch(callback);
};