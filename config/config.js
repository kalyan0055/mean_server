'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
	glob = require('glob');

/**
 * Load app configurations
 */
module.exports = _.extend(
	require('./env/all'),
	require('./env/development') || {}
);

/**
 * Get files by glob patterns
 */
module.exports.getGlobbedFiles = function(globPatterns, removeRoot) {
	// For context switching
	var _this = this;

	// URL paths regex
	var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

	// The output array
	var output = [];

	// If glob pattern is array so we use each pattern in a recursive way, otherwise we use glob 
	if (_.isArray(globPatterns)) {
		globPatterns.forEach(function(globPattern) {
			output = _.union(output, _this.getGlobbedFiles(globPattern, removeRoot));
		});
	} else if (_.isString(globPatterns)) {
		if (urlRegex.test(globPatterns)) {
			output.push(globPatterns);
		} else {
			glob(globPatterns, {
				sync: true
			}, function(err, files) {
				if (removeRoot) {
					files = files.map(function(file) {
						return file.replace(removeRoot, '');
					});
				}

				output = _.union(output, files);
			});
		}
	}

	return output;
};

/**
 * Get the modules JavaScript files
 */
// module.exports.getJavaScriptAssets = function(includeTests) {
// 	var output = this.getGlobbedFiles(this.assets.lib.js.concat(this.assets.js), 'public/');

// 	// To include tests
// 	if (includeTests) {
// 		output = _.union(output, this.getGlobbedFiles(this.assets.tests));
// 	}

// 	return output;
// };
module.exports.log    = {file:'/var/log/nvipani/nvipani-nodejs.log'};
module.exports.limit='5mb';
module.exports.reportLocation    =require('path').join(__dirname, '../Reports/');
module.exports.emailRegEx=/^[_a-zA-Z0-9]+(\.[_a-zA-Z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;
module.exports.phoneEx=/^[0-9]{10,11}$/;
module.exports.emailOrPhoneRegEx=/^(?:\d{10,11}|([_a-zA-Z0-9]+(\.[_a-zA-Z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})))$/;
module.exports.fileAccess    =require('path').join(__dirname, '../Reports/data');

module.exports.adminuser='hema@nvipani.com';
module.exports.nvipaniAdminUsers = 'admin@nvipani.com';
module.exports.bbapikey='nvipaniandroid';
module.exports.versionNumber='1.0.10';
module.pageOption='10';
module.exports.app='New Registration link on Nvipani';
module.exports.mailer = {
	from: 'nVipani <rambabuemandi77@gmail.com>',
	options: {
		service: 'gmail',
		auth: {
			user: 'rambabuemandi77@gmail.com',
			pass: 'sachintendulkar'
		}
	}
};
module.exports.sendEmail = true;
module.exports.authType1='Adminuser';
module.exports.authType='Admin';

/**
 * Get the modules CSS files
 */
// module.exports.getCSSAssets = function() {
// 	var output = this.getGlobbedFiles(this.assets.lib.css.concat(this.assets.css), 'public/');
// 	return output;
// };
