'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend user's controller
 */
module.exports = _.extend(
	//require('./users/users.authentication.server.controller11'),
	require('./users/users.authorization.server.controller'),
	require('./users/users.password.server.controller'),
	require('./users/users.profile.server.controller'),
	require('./users/newusers.profile.server.controller'),
	require('./users/users.authentication.server.controller')
);