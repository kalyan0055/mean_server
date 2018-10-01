'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	jwt = require('jwt-simple'),
	// User = mongoose.model('User'),
	User = mongoose.model('Newuser'),
	token_secret = 'nVipani-software-solutions',
	logger = require('../../../lib/log').getLogger('USERS', 'DEBUG');
exports.TOKEN_SECRET = token_secret;


exports.genToken = function(username, id) {
	var d = new Date();
	var daysToExpiry = 7;
	d.setDate(d.getDate() + daysToExpiry);
	var info = {
		iss : {username:username, id:id},
		exp : d
	};
	return jwt.encode(info, token_secret);
};

exports.isValidToken = function(token) {
	var info = jwt.decode(token, token_secret);
	if (new Date(info.exp) > Date.now()) {
		return info.iss;
	}
	return false;
};

exports.getUserByToken = function(token, done) {
	var reqUser = this.isValidToken(token);
	if(reqUser) {
		done(null, reqUser);
	} else {
		done(new Error('Invalid Token.'));
	}
};

/**
 * Send User
 */
exports.findUserByToken = function(token, done) {
	//var reqUser = this.isValidToken(token);	
	if(token) {
		User.findOne({'_id': token._id}, '-salt -password', function (err, user) {
			if (err) {
				done(err);
			}
			if (user) {
				console.log(user,'user finded');
				
				done(null, user);
			} else {
				done(new Error('No user with username - '+token.username+ ', id-'+token.id));
			}
		});
	} else {
		done(new Error('Session Expired.'));
	}
};


exports.findUserByEmail_Password = function(token, done) {
	//var reqUser = this.isValidToken(token);
	console.log(token.username,token.password, 'nothing but ui data');
	
	if(token) {
		User.findOne({'email': token.username,'password':token.password}, '-salt -password', function (err, user) {
			if (err) {
				done(err);
			}
			if (user) {
				console.log(user,'user finded');
				
				done(null, user);
			} else {
				done(new Error('No user with username - '+token.username+ ', id-'+user._id));
			}
		});
	} else {
		done(new Error('Session Expired.'));
	}
};




exports.findUserCompanyByToken = function(token, done) {
	var reqUser = this.isValidToken(token);
	if(reqUser) {
		User.findOne({
			'username': reqUser.username,
			'_id': reqUser.id,
            deleted:false,disabled:false
		}, '-salt -password').populate('company', 'settings segments').exec(function (err, user) {
			if (err) {
				done(err);
			}
			if (user) {
				done(null, user);
			} else {
				done(new Error('No user with username - '+reqUser.username+ ', id-'+reqUser.id));
			}
		});
	} else {
		done(new Error('Invalid Token.'));
	}
};

exports.findUserByStatusToken = function(satusToken, done) {
    if(satusToken) {
        User.findOne({
            'statusToken': satusToken,
            deleted:false,disabled:false
        }).populate('company').exec(function (err, user) {
            if (err) {
                done(err);
            }
            if (user) {
                done(null, user);
            } else {
                done(new Error('No user with status token - '+satusToken));
            }
        });
    } else {
        done(new Error('Invalid Token.'));
    }
};

exports.findUserById = function(userId, done) {
    User.findOne({
        _id: userId,
        'deleted': false
    }).select('-salt -password').exec(function (userErr, user) {
        if (userErr) {
            logger.error('Error while fetch employee user in users ' + userId + 'Error:' + userErr);
            done(userErr, null);
        } else if (!user) {
            logger.error('Employee user is not found in users ' + userId);
            done(new Error('Employee user is not found in users'), null);
        } else {
            done(null, user);
        }
    });
}


exports.findUserByIdOnly = function(userId, done) {
    User.findOne({
        _id: userId,
    }).select('-salt -password').exec(function (userErr, user) {
        if (userErr) {
            logger.error('Error while fetch employee user in users ' + userId + 'Error:' + userErr);
            done(userErr, null);
        } else if (!user) {
            logger.error('Employee user is not found in users ' + userId);
            done(new Error('Employee user is not found in users'), null);
        } else {
            done(null, user);
        }
    });
}

