'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash');

/**
 * Extend user's controller
 */
module.exports = _.extend(
	require('./users/internaluser.authorization.server.controller'),
	require('./users/internaluser.password.server.controller'),
	require('./users/users.profile.server.controller'),
	require('./users/internaluser.profile.server.controller'),
	require('./users/internaluser.authentication.server.controller')
);