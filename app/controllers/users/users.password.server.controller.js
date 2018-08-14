'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    errorHandler = require('../errors.server.controller'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    // User = mongoose.model('User'),
    User = mongoose.model('Newuser'),

    config = require('../../../config/config'),
    nodemailer = require('nodemailer'),
    async = require('async'),
  //  sms = require('../utils/sms.util'),
    usersJWTUtil = require('../utils/users.jwtutil'),
    logger = require('../../../lib/log').getLogger('USERS', 'DEBUG'),
    notp = require('notp'),
    config = require('../../../config/config'),
    crypto = require('crypto');

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function (req, res, next) {

    var array={};
    if(req.body.username){
        array.username=req.body.username;
    }else if(req.body.forgotPasswordOtp){
        array.forgotPasswordOtp=req.body.forgotPasswordOtp;
    }
    async.waterfall([
        // Generate random token
        function (done) {
            crypto.randomBytes(20, function (err, buffer) {
                var token = buffer.toString('hex');
                done(err, token);
            });
        },
        // Lookup user by username
        function (token, done) {
        if (req.body.username) {
            User.findOne(req.body.username, '-salt -password', function (err, user) {
                if (!user) {
                    return res.status(400).send({
                        status: false,
                        message: 'No account with that username has been found'
                    });
                } else if (user.provider !== 'local') {
                    return res.status(400).send({
                        status: false,
                        message: 'It seems like you signed up using your ' + user.username + ' account'
                    });
                } else if (user.allowRegistration === 'false' || user.status === 'Register Request') {
                    return res.status(400).send({
                        status: false,
                        userstatus: user.status,
                        message:  user.username + ' account is not Activated Yet'
                    });
                }else {
                    if(user.username===user.mobile && ! array.forgotPasswordOtp){
                        var K = '12345678901234567890';
                        var otp= notp.totp.gen(K, {});
                        //TODO: The below line Needs to be commented.
                        //logger.debug('OTP-' + otp);
                        // done(err, token, otp);
                        logger.debug('Started otp:'+otp);
                        user.forgotPasswordOtp=otp;
                    }else {
                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                    }
                    user.save(function (err) {
                        if(user.username===user.mobile){
                            done(err, token, user,otp);
                        }else {
                            done(err, token, user,null);
                        }
                    });

                }
            });
        } else {
            return res.status(400).send({
                status: false,
                message: 'Username field must not be blank'
            });
        }
    },
    function (token, user, otp,done) {
        if(otp){
            done(null, null, user,otp);
        }else {
            res.render('templates/reset-password-email', {
                name: user.displayName,
                appName: config.app.title,
                url: req.protocol + '://' + req.headers.host + '/auth/reset/' + token
            }, function (err, emailHTML) {
                done(err, emailHTML, user,null);
            });
        }
    },
    // If valid email, send reset email using service
    function (emailHTML, user,otp, done) {
        if(otp){
            sms.sendOTP(user.mobile, otp, function (err, response) {
                if (!err) {
                    logger.debug('Sending SMS Response-' + response);
                    if (process.env.NODE_ENV === 'development' || (!config.production)) {
                        res.send({
                            status: true,
                            statusToken: user.statusToken,
                            message: 'An OTP has been sent to ' + user.username + '. ' + otp + ' is your One Time Password (OTP)'
                        });
                    }else {
                        res.send({
                            status: true,
                            statusToken: user.statusToken,
                            message: 'An OTP has been sent to ' + user.username
                        });
                    }
                }else {
                    done(err);
                }
            });
        }else {
            var smtpTransport = nodemailer.createTransport(config.mailer.options);
            var mailOptions = {
                to: user.username,
                from: config.mailer.from,
                subject: 'Password Reset',
                html: emailHTML
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                if (!err) {
                    res.send({
                        status: true,
                        statusToken:user.statusToken,
                        message: 'An email has been sent to ' + user.email + ' with further instructions.'
                    });
                }

                done(err);
            });
        }
    }
    ], function (err) {
        if (err) return next(err);
    });
};

/**
 * Reset password GET from email token
 */
exports.validateResetToken = function (req, res) {

    var mobileAppKey=req.headers.apikey;
    User.findOne({
        resetPasswordToken: req.query.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function (err, user) {
        if (!user) {
            if(mobileAppKey===config.bbapikey){
                res.status(400).send({
                   message:'Email link has been expired',
                    status:false
                });
            }else{
                return res.redirect('/#!/password/reset/invalid');
            }
        }
        if(mobileAppKey===config.bbapikey){
            res.send({
                resetPasswordToken: req.query.token,
                status:true
            });
        }else {
            res.redirect('/#!/password/reset/' + req.query.token);
        }
    });
};

/**
 * Reset password POST from email token
 */
exports.reset = function (req, res, next) {
    // Init Variables
    var passwordDetails = req.body;
   // var mobileAppKey=req.headers.apikey;
    async.waterfall([

        function (done) {
            User.findOne({
                resetPasswordToken:passwordDetails.otp,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function (err, user) {
                if (!err && user) {
                    if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
                        let salt;
                        salt = (crypto.randomBytes(16));
                        user.salt = salt;
                        user.password = user.hashPassword(passwordDetails.newPassword);
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            if (err) {
                                return res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(err)
                                });
                            } 
                            //else {
                                 
                                //res.json({token:usersJWTUtil.genToken(user.username, user.id)});
                              //  if(mobileAppKey===config.bbapikey){

                                   // res.send({
                                    //    status: true,
                                   //     message: 'Successfully Changed Password'
                                   // });

                                // }else {
                                //     res.redirect('/#!/signin');
                                // }
                                // done(err, user);
                           // }
                        });
                    } else {
                        return res.status(400).send({
                            status: false,
                            message: 'Passwords do not match'
                        });
                    }
                } else {
                    return res.json({
                        status: false,
                        message: 'Password reset token is invalid or has expired.'
                    });
                }
            });
        },
        function (user, done) {
            res.render('templates/reset-password-confirm-email', {
                name: user.displayName,
                appName: config.app.title
            }, function (err, emailHTML) {
                done(err, emailHTML, user);
            });
        },
        // If valid email, send reset email using service
        function (emailHTML, user, done) {
            var smtpTransport = nodemailer.createTransport(config.mailer.options);
            var mailOptions = {
                to: 'rambabu.e@technoxis.in',
                from: config.mailer.from,
                subject: 'Your password has been changed',
                html: emailHTML
            };

            smtpTransport.sendMail(mailOptions, function (err) {
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) {return next(err)}else{
             res.send({
                                       status: true,
                                       message: 'Successfully Changed Password'
                                   });
        } ;
    });
};

/**
 * Change Password
 */
exports.changePassword = function (req, res) {
    // Init Variables
    var passwordDetails = req.body;
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                status: false,
                message: errorHandler.getErrorMessage(err)
            });
        }
        if (user) {
            if (passwordDetails.newPassword) {
                User.findById(user.id, function (err, user) {
                    if (!err && user) {
                        if (user.authenticate(passwordDetails.currentPassword)) {
                            if (passwordDetails.newPassword === passwordDetails.verifyPassword) {
                                user.password = passwordDetails.newPassword;

                                user.save(function (err) {
                                    if (err) {
                                        return res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(err)
                                        });
                                    } else {
                                        res.json({
                                            status: true,
                                            token: usersJWTUtil.genToken(user.username, user.id),
                                            user: user
                                        });
                                    }
                                });
                            } else {
                                res.status(400).send({
                                    status: false,
                                    message: 'Passwords do not match'
                                });
                            }
                        } else {
                            res.status(400).send({
                                status: false,
                                message: 'Current password is incorrect'
                            });
                        }
                    } else {
                        res.status(400).send({
                            status: false,
                            message: 'User is not found'
                        });
                    }
                });
            } else {
                res.status(400).send({
                    status: false,
                    message: 'Please provide a new password'
                });
            }
        } else {
            res.status(400).send({
                status: false,
                message: 'User is not signed in'
            });
        }
    });
};
