'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	//User = require('mongoose').model('Newuser');
	 User = require('mongoose').model('User');
	 
module.exports = function() {
	// Use local strategy
	passport.use(new LocalStrategy({
			usernameField: 'username',
			passwordField: 'password'
		},
		function(username, password, done) {
 
			User.findOne({
				username: username
			}, function(err, user) {
			//  console.log(user,'local js ');
						
				if (err) {
					return done(err);
				}
				if (!user) {
					return done(null, false, {
						//message: 'Unknown UserName "'+ username+'"'
						message:'Entered Username or Password is incorrect'
					});
				}
				else if (user.status!=='Registered') {
					 	
					return done(null, false, {
						message: 'User is not in active state',
						userstatus: user.status
					});
				}
				else if (user.deleted ===true) {
					 	
					return done(null, false, {
						message: 'User was deleted',
						userstatus: user.status
					});
				}
				else if (!user.authenticate(password)) {
					return done(null, false, {
						message: 'Entered Username or Password is incorrect'
					});
				}
 
				return done(null, user);
			});
		}
	));
};
