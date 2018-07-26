'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	newUser = require('mongoose').model('Newuser');
	 
module.exports = function() {
	// Use local strategy
	passport.use(new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password'
		},
		function(username, password, done) {
			console.log(username,password,'dddddddddddd');
			
			newUser.findOne({
				username: username
			}, function(err, user) {
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false, {
						message: 'Unknown UserName "'+ username+'"'
					});
				}
				else if (user.status!=='Registered') {
					console.log('else if ');
					
					return done(null, false, {
						message: 'User is not in active state',
						userstatus: user.status
					});
				}
				else if (!user.authenticate(password)) {
					return done(null, false, {
						message: 'Invalid password'
					});
				}
 
				return done(null, user);
			});
		}
	));
};
