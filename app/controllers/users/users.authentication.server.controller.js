'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    errorHandler = require('../errors.server.controller'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    notp = require('notp'),
    usersJWTUtil = require('../utils/users.jwtutil'),
    // companyUtil = require('../utils/common.company.util'),
    userUtil = require('../utils/common.users.util'),
    // sms = require('../utils/sms.util'),
    logger = require('../../../lib/log').getLogger('USERS', 'DEBUG'),
    // User = mongoose.model('User'),
    User = mongoose.model('Newuser'),

    nodemailer = require('nodemailer'),
    async = require('async'),
    crypto = require('crypto'),
    config = require('../../../config/config'),
    // Company = mongoose.model('Company'),
    // Notification = mongoose.model('Notification'),
    // RegistrationCategory = mongoose.model('RegistrationCategories'),
    // BusinessSegments = mongoose.model('BusinessSegments'),
    dbUtil = require('../utils/common.db.util'),
    // Offer = mongoose.model('Offer'),
    // Order = mongoose.model('Order'),
    K = '12345678901234567890',
    globalUtil = require('../../controllers/utils/common.global.util');
//  BusinessUnit = mongoose.model('BusinessUnit'),
//   Contact = mongoose.model('Contact');

 

function createCompanyContactWhileRegister(user, done) {
    var contact = new Contact();
    contact.firstName = user.firstName;
    contact.lastName = user.lastName;
    contact.middleName = user.middleName;
    contact.emails = [];
    if (user.email && user.email.length > 0)
        contact.emails.push({
            email: user.email,
            emailType: 'Work',
            primary: true
        });
    if (user.mobile && user.mobile.length > 0)
        contact.phones.push({
            phoneNumber: user.mobile,
            phoneType: 'Mobile',
            primary: true
        });
    contact.user = user._id;
    contact.company = user.company;
    contact.addresses = user.addresses;
    contact.nVipaniCompany = user.company;
    contact.nVipaniRegContact = true;
    contact.nVipaniUser = user;
    contact.save(function (contactErr) {
        if (contactErr) {
            done(contactErr);
        } else {
            done(null);
        }
    });
}

/**
 * Signup
 */
exports.signup = function (req, res) {
    User.findOne({
        statusToken: req.query.registerToken,

        //_id:req.params._id
        /*resetPasswordExpires: {
         $gt: Date.now()
         }*/
    }, '-salt -password', function (err, user) {
        if (!err && user) {
            if (user.status === 'Register Request') {
                user = _.extend(user, '');
                user.displayName = user.firstName + (user.lastName ? ' ' + user.lastName : '') + (user.middleName ? ' ' + user.middleName : '');
                user.email = user.username;
                user.provider = 'local';
                user.status = 'Registered';
                user.updated = Date.now();
                user.save(function (err) {
                    if (err) {
                        return res.status(400).send({
                            status: false,
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        createCompanyContactWhileRegister(user, function (contactErr) {
                            if (contactErr) {
                                return res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(contactErr)
                                });
                            } else {
                                res.json({ status: true, token: usersJWTUtil.genToken(user.username, user.id) });

                            }
                        });
                    }
                });
            } else {
                return res.status(400).send({
                    status: false,
                    message: 'User is already Registered'
                });
            }
        } else {
            return res.status(400).send({
                status: false,
                message: 'Register User token is invalid or has expired.'
            });
        }
    });
};

/**
 * Signin after passport authentication
 */

exports.validateRegisterToken = function (req, res) {
    User.findOne({
        statusToken: req.query.registerToken
        /*	resetPasswordExpires: {
         $gt: Date.now()
         }*/
    }, function (err, user) {
        if (!user) {
            //return res.redirect('/register/invalid');
            if (err) {
                return res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                return res.status(400).send({
                    status: false,
                    message: 'Register User token is invalid or has expired.'
                });
            }
        } else {
            //return res.redirect('/auth/signup/');
            res.redirect('/signup/' + req.query.registerToken);
        }

        //	res.jsonp(user);
        //
        //signup();
    });
};
exports.validateAcceptRegisterToken = function (req, res) {

    User.findOne({
        statusToken: req.query.registerToken,
        status: 'Register Request'
    }, '-salt -password', function (err, user) {
        if (!err && user) {
            if (user.status === 'Register Request') {
                user = _.extend(user, '');
                user.displayName = user.firstName + (user.lastName ? ' ' + user.lastName : '') + (user.middleName ? ' ' + user.middleName : '');
                //user.email = user.username;
                user.provider = 'local';
                user.status = 'Registered';
                user.emailVerified = true;
                user.updated = Date.now();
                user.save(function (userUpdater) {
                    if (userUpdater) {
                        res.render('templates/invalid-user', {
                            url: req.headers.host,
                            title: config.app.title,
                            req: req,
                            res: res,
                            success: false,
                            errorMessage: errorHandler.getErrorMessage(userUpdater) + user.username
                        });

                    } else {
                        createCompanyContactWhileRegister(user, function (err) {
                            if (err) {
                                res.render('templates/invalid-user', {
                                    url: req.headers.host,
                                    title: config.app.title,
                                    req: req,
                                    res: res,
                                    success: false,
                                    errorMessage: errorHandler.getErrorMessage(err) + user.username
                                });
                            } else {
                                userUtil.updateContactWithnVipaniUser(user, function (nVipaniUserUpdateErr) {
                                    if (nVipaniUserUpdateErr) {
                                        res.render('templates/invalid-user', {
                                            url: req.headers.host,
                                            title: config.app.title,
                                            req: req,
                                            res: res,
                                            success: false,
                                            errorMessage: errorHandler.getErrorMessage(nVipaniUserUpdateErr) + user.username
                                        });
                                    } else {
                                        /*res.json({token: usersJWTUtil.genToken(user.username, user.id)});*/
                                        var token = usersJWTUtil.genToken(user.username, user.id);
                                        /*  res.redirect('/register/invalid');*/


                                        if (token) {
                                            res.render('templates/user-activation', {
                                                success: true,
                                                url: req.headers.host,
                                                username: user.username,
                                                successMessage: 'Successfully Activated user ' + user.username
                                            });
                                        } else {

                                            res.render('templates/invalid-user', {
                                                url: req.headers.host,
                                                title: config.app.title,
                                                req: req,
                                                res: res,
                                                success: false,
                                                errorMessage: 'Failed to get the token for the :' + user.username
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.render('templates/invalid-user', {
                    url: req.headers.host,
                    title: config.app.title,
                    req: req,
                    res: res,
                    success: false,
                    errorMessage: user.username + ' is already Registered'
                });
            }
        } else {
            res.render('templates/invalid-user', {
                url: req.headers.host,
                title: config.app.title,
                req: req,
                res: res,
                success: false,
                errorMessage: 'Register User token is invalid or has expired.'
            });
        }
    });
};


exports.validateOTPAcceptRegisterToken = function (req, res) {
    logger.debug('Status Token-' + req.query.statusToken);

    var username = req.body.username;
    var token = req.query.statusToken;
    var otp = req.body.otp;
    var array = { status: 'Register Request' };
    if (token) {
        logger.debug('Status Token-' + req.query.statusToken);
        array.statusToken = req.query.statusToken;
    }
    else if (username) {
        logger.debug('UserName-' + req.body.username);
        array.username = req.body.username;
    }
    if (otp) {
        logger.debug('otp-' + otp);
        array.otp = req.body.otp;
    }
    User.findOne(array, '-salt -password', function (err, user) {
        if (!err && user) {
            if (user.status === 'Register Request') {
                user = _.extend(user, '');
                user.displayName = user.firstName + (user.lastName ? ' ' + user.lastName : '') + (user.middleName ? ' ' + user.middleName : '');
                //user.email = user.username;
                user.provider = 'local';
                user.status = 'Registered';
                user.mobileVerified = true;
                user.updated = Date.now();
                user.save(function (userUpdateErr) {
                    if (userUpdateErr) {
                        return res.status(400).send({
                            status: false,
                            message: errorHandler.getErrorMessage(userUpdateErr)
                        });
                    } else {
                        createCompanyContactWhileRegister(user, function (err) {
                            if (err) {
                                return res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(err)
                                });
                            } else {
                                userUtil.updateContactWithnVipaniUser(user, function (nVipaniUserUpdateErr) {
                                    if (nVipaniUserUpdateErr) {
                                        return res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(nVipaniUserUpdateErr)
                                        });
                                    } else {
                                        var token = usersJWTUtil.genToken(user.username, user.id);
                                        if (token) {
                                            return res.send({
                                                status: true,
                                                message: 'Successfully Activated user ' + user.username
                                            });
                                        } else {
                                            return res.status(400).send({
                                                status: false,
                                                message: 'Failed to get the token for the :' + user.username
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.render('templates/invalid-user', {
                    url: req.headers.host,
                    title: config.app.title,
                    req: req,
                    res: res,
                    success: false,
                    errorMessage: user.username + ' is already Registered'
                });
            }
        } else {
            if (otp) {
                return res.status(400).send({
                    status: false,
                    message: 'Failed to match the otp :' + otp
                });
            } else if (username) {
                return res.status(400).send({
                    status: false,
                    message: 'Failed to get user name :' + username
                });
            }
        }
    });
};
exports.forgotPasswordWithOtp = function (req, res) {
    var username = req.body.username;
    var token = req.query.statusToken;
    var otpGenerated = req.body.otpGenerated;
    var otpVerified = req.body.otpVerified;
    var otp = req.body.forgotPasswordOtp;
    if (req.body.otp) {
        otp = req.body.otp;
    }
    var newPassword = req.body.newPassword;
    var verifyPassword = req.body.verifyPassword;
    var array = {};
    if (token) {
        logger.debug('Status Token-' + req.query.statusToken);
        array.statusToken = req.query.statusToken;
    } else if (username) {
        logger.debug('UserName-' + req.body.username);
        array.username = req.body.username;
    }
    if (otp) {
        logger.debug('otp-' + otp);
        //array.forgotPasswordOtp = req.body.forgotPasswordOtp;
    }
    if (newPassword) {
        logger.debug('password-' + newPassword);
        // array.newPassword=req.body.newPassword;
    }
    if (verifyPassword) {
        logger.debug('Verify password -' + verifyPassword);
        //array.verifyPassword=req.body.verifyPassword;
    }
    if (array.statusToken || array.username)
        User.findOne(array, '-salt -password', function (err, user) {
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
            } else if (user.allowRegistration === 'false' || user.status === 'Register Request' || user.status === 'Verified') {
                return res.status(400).send({
                    status: false,
                    userstatus: user.status,
                    message: user.username + ' account is not Activated Yet'
                });
            } else if (otp && newPassword && newPassword !== null && otpVerified) {
                if (newPassword === verifyPassword && otp === user.forgotPasswordOtp) {
                    user.password = newPassword;
                    /* user.resetPasswordToken = undefined;
                     user.resetPasswordExpires = undefined;*/

                    user.save(function (err) {
                        if (err) {
                            return res.status(400).send({
                                status: false,
                                changedPassword: false,
                                message: errorHandler.getErrorMessage(err)
                            });
                        } else {
                            res.send({
                                status: true,
                                changedPassword: true,
                                message: 'Successfully Changed password'
                            });
                        }
                    });
                } else {
                    if (otpVerified && newPassword !== verifyPassword) {
                        return res.status(400).send({
                            status: false,
                            message: 'Passwords do not match'
                        });
                    } else if (otpGenerated && otp !== user.forgotPasswordOtp) {
                        return res.status(400).send({
                            status: false,
                            message: 'OTP do not match'
                        });
                    } else {
                        return res.status(400).send({
                            status: false,
                            message: 'OTP do not match'
                        });
                    }
                }
            } else {
                /* if (user.username === user.mobile) {*/
                if (!otp) {
                    var K = '12345678901234567890';
                    otp = notp.totp.gen(K, {});
                    //TODO: The below line Needs to be commented.
                    //logger.debug('OTP-' + otp);
                    // done(err, token, otp);
                    logger.debug('Started otp:' + otp);
                    user.forgotPasswordOtp = otp;
                    user.save(function (errs, savedUser) {
                        if (user.username === user.mobile) {
                            if (process.env.NODE_ENV === 'development' || (!config.production)) {
                                res.send({
                                    status: true,
                                    statusToken: savedUser.statusToken,
                                    otpGenerated: true,
                                    message: 'An OTP has been sent to ' + savedUser.username + '. ' + otp + ' is your One Time Password (OTP)'
                                });
                            } else {
                                sms.sendOTP(savedUser.mobile, savedUser.forgotPasswordOtp, function (err, response) {
                                    if (!err) {
                                        logger.debug('Sending SMS Response-' + response);
                                        res.send({
                                            status: true,
                                            statusToken: savedUser.statusToken,
                                            otpGenerated: true,
                                            message: 'An OTP has been sent to ' + savedUser.username + '. ' + otp + ' is your One Time Password (OTP)'
                                        });
                                    } else {
                                        logger.error('Error while sending the OTP to ' + user.username, err);
                                        res.send({
                                            status: false,
                                            statusToken: user.statusToken,
                                            message: 'Error while sending the OTP to ' + user.username
                                        });
                                        // done(err);
                                    }
                                });
                            }
                        } else {
                            if (process.env.NODE_ENV === 'development' || (!config.production)) {
                                res.send({
                                    status: true,
                                    statusToken: savedUser.statusToken,
                                    otpGenerated: true,
                                    message: 'An OTP has been sent to ' + savedUser.username + '. ' + otp + ' is your One Time Password (OTP)'
                                });
                            } else {
                                var smtpTransport = nodemailer.createTransport(config.mailer.options);
                                res.render('templates/reset-password-email', {
                                    name: user.displayName,
                                    appName: config.app.title,
                                    url: req.protocol + '://' + req.headers.host + '/auth/reset/' + user.resetPasswordToken
                                }, function (err, emailHTML) {
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
                                                resetPasswordToken: user.resetPasswordToken,
                                                message: 'An email has been sent to ' + user.email + ' with further instructions.'
                                            });
                                        }

                                        // done(err);
                                    });
                                });
                            }
                        }

                    });
                } else if (otp === user.forgotPasswordOtp) {
                    res.send({
                        status: true,
                        verifiedOtp: true
                        // message:  user.username + ' account is not Activated Yet'
                    });
                } else if (otp && otp !== user.forgotPasswordOtp) {
                    return res.status(400).send({
                        status: false,
                        verifiedOtp: false,
                        message: 'Verified OTP for the ' + user.username + ' is not correct'
                    });
                } else {
                    return res.status(400).send({
                        status: false,
                        verifiedOtp: false,
                        message: user.username + ' account is not Activated Yet'
                    });
                }
                /*  } else {
                      user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
                      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
                      user.save(function (err) {

                          var smtpTransport = nodemailer.createTransport(config.mailer.options);
                          res.render('templates/reset-password-email', {
                              name: user.displayName,
                              appName: config.app.title,
                              url: req.protocol + '://' + req.headers.host + '/auth/reset/' + user.resetPasswordToken
                          }, function (err, emailHTML) {
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
                                          resetPasswordToken: user.resetPasswordToken,
                                          message: 'An email has been sent to ' + user.email + ' with further instructions.'
                                      });
                                  }

                                  // done(err);
                              });

                          });
                      });
                  }*/

            }
        });
    else {
        return res.status(400).send({
            status: false,
            message: 'No user name'
        });
    }
};
exports.resendOTP = function (req, res) {
    //
    var username = req.body.username;
    var token = req.query.statusToken;
    var array = { status: 'Register Request' };
    if (token) {
        logger.debug('Status Token-' + req.query.statusToken);
        array.statusToken = req.query.statusToken;
    }
    else if (username) {
        logger.debug('UserName-' + req.body.username);
        array.username = req.body.username;
    }
    User.findOne(array, '-salt -password', function (err, user) {
        if (!err && user && (user.username === username || user.statusToken === token)) {
            if (user.status === 'Register Request') {
                if (user.username === user.mobile) {
                    logger.debug('Sending OTP -' + user.otp);
                    sms.sendOTP(user.mobile, user.otp, function (err, response) {
                        if (!err) {
                            logger.debug('SMS Response-' + response);
                            if (process.env.NODE_ENV === 'development' || (!config.production)) {
                                //if((!config.production)) {
                                return res.send({
                                    status: true,
                                    statusToken: user.statusToken ? user.statusToken : user.username,
                                    message: 'An OTP has been  resent to ' + user.username + '. ' + user.otp + ' is your One Time Password (OTP)'
                                });
                            } else {
                                return res.send({
                                    status: true,
                                    statusToken: user.statusToken ? user.statusToken : user.username,
                                    message: 'An OTP has been resent to ' + user.username
                                });
                            }
                        } else {
                            return res.status(400).send({
                                status: false,
                                message: 'Error while resending the OTP to mobile ' + user.username
                            });
                        }
                    });
                } else {
                    res.render('templates/user-registration', {
                        name: 'Customer',
                        appName: config.app.title,
                        url: req.protocol + '://' + req.headers.host + '/user/register/' + user.statusToken
                    }, function (err, emailHTML) {
                        var smtpTransport = nodemailer.createTransport(config.mailer.options);
                        var mailOptions = {
                            to: user.username,
                            from: config.mailer.from,
                            subject: 'Registration Request',
                            html: emailHTML,
                        };
                        if (config.production && user.allowRegistration) {
                            mailOptions.bcc = config.nvipaniAdminUsers;
                        }
                        smtpTransport.sendMail(mailOptions, function (err) {
                            if (!err) {
                                if (process.env.NODE_ENV === 'development' || (!config.production)) {
                                    //if((!config.production)) {
                                    return res.send({
                                        status: true,
                                        email: true,
                                        username: user.username,
                                        statusToken: user.statusToken ? user.statusToken : user.username,
                                        message: 'An OTP has been  sent to ' + user.username + '. ' + user.emailOtp + ' is your One Time Password (OTP)'
                                    });
                                } else {
                                    res.send({
                                        status: true,
                                        email: true,
                                        username: user.username,
                                        statusToken: user.statusToken ? user.statusToken : user.username,
                                        message: 'An email has been sent to ' + user.username + ' with further instructions.'
                                    });
                                }
                            }

                        });
                    });

                }
            } else {
                return res.status(400).send({
                    status: false,
                    message: user.username + ' is already Registered'
                });
            }
        } else {
            return res.status(400).send({
                status: false,
                message: 'Register User token is invalid or has expired.'
            });
        }
    });
};

exports.findByUserStatusToken = function (req, res) {
    //var category=User.schema.path('userCategory').enumValues;
    User.findOne({
        statusToken: req.query.registerToken,
        /*	resetPasswordExpires: {
         $gt: Date.now()
         }*/
    }, function (err, user) {
        if (!user) {
            //return res.redirect('/register/invalid');
            if (err) {
                return res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                return res.status(400).send({
                    status: false,
                    message: 'Register User token is invalid or has expired.'
                });
            }
        } else {
            res.jsonp(user);
        }

        //
        //
        //signup();
    });
};

exports.signin = function (req, res, next) {
    //logger.debug('Request Body-'+JSON.stringify(req.body));
    passport.authenticate('local', function (err, user, info) {
        if (err || !user) {
            info.status = false;
            logger.error('Error Signin with username -' + req.body.username + ', -' + JSON.stringify(info));
            //logger.debug('Error Message-'+JSON.stringify(info));
            res.status(400).send(info);
        } else {
            User.findOne({
                username: user.username
            }).select('-salt -password').populate('company', 'category segments registrationCategory').exec(function (err, dbuser) {
                if (dbuser) {
                    var devicename;
                    var devicedescription;
                    var devicetoken;
                    var location;
                    var ipaddress;
                    var deviceid;
                    var appversion;
                    if (req.body.devicename) {
                        devicename = req.body.devicename;
                    }
                    if (req.body.appversion) {
                        appversion = req.body.appversion;
                    }

                    if (req.body.deviceid) {
                        deviceid = req.body.deviceid;
                    }
                    if (req.body.devicedescription) {
                        devicedescription = req.body.devicedescription;
                    }
                    if (req.body.devicetoken) {
                        devicetoken = req.body.devicetoken;
                    }

                    if (req.body.location) {
                        location = req.body.location;
                    }

                    if (req.body.ipaddress) {
                        ipaddress = req.body.ipaddress;
                    }

                    if (!dbuser.devices) {
                        dbuser.devices = [];
                    }
                    if (deviceid && devicetoken && dbuser.devices.filter(function (device) {
                        return device.deviceid === deviceid;
                    }).length === 0) {
                        dbuser.devices.push({
                            deviceid: deviceid,
                            name: devicename,
                            description: devicedescription,
                            token: devicetoken,
                            appversion: appversion
                        });
                    }

                    if (!dbuser.accountActivity) {
                        dbuser.accountActivity = [];
                    }
                    if (deviceid) {
                        dbuser.accountActivity.push({
                            deviceid: deviceid,
                            accessType: devicename + '(' + devicedescription + ')',
                            location: location,
                            ipAddress: ipaddress,
                            loginTime: Date.now(),
                            appversion: appversion
                        });
                    }
                    dbuser.updated = Date.now();
                    dbuser.save(function (err, resultUser) {
                        if (err) {
                            logger.error('Error updating the user with username -' + req.body.username);
                            //logger.debug('Error Message-'+JSON.stringify(info));
                            res.status(400).send({
                                status: false,
                                message: 'Error updating the user with username -' + req.body.username
                            });
                        } else {
                            var token = usersJWTUtil.genToken(resultUser.username, resultUser.id);
                            res.json({
                                status: true,
                                token: token,
                                data: user
                            });
                            //logger.debug('token-'+token);
                            // if (resultUser.company.segments.length === 0) {
                            //     RegistrationCategory.findById(resultUser.company.registrationCategory).exec(function (registrationCErr, registrationCategory) {
                            //         if (registrationCErr) {
                            //             res.status(400).send({
                            //                 status: false,
                            //                 message: registrationCErr.getMessage()
                            //             });
                            //         } else {
                            //             BusinessSegments.find().populate('categories.category').exec(function (businessErr, businessSegments) {
                            //                 companyUtil.findCompanyEmployeeBusinessUnits(user, function (userBusinessUnitsError, userBusinessUnits) {
                            //                     if (userBusinessUnitsError) {
                            //                         res.status(400).send({
                            //                             status: false,
                            //                             message: errorHandler.getErrorMessage(userBusinessUnitsError)
                            //                         });
                            //                     } else {
                            //                         res.json({
                            //                             status: true,
                            //                             token: token,
                            //                             businessUnits: userBusinessUnits,
                            //                             companySegments: resultUser.company.segments,
                            //                             categories: resultUser.company.categories,
                            //                             segments: businessSegments,
                            //                             registrationCategory: registrationCategory
                            //                         });
                            //                     }
                            //                 });
                            //             });
                            //         }


                            //     });
                            // } else {
                            //     companyUtil.findCompanyEmployeeBusinessUnits(user, logger, function (userBusinessUnitsError, userBusinessUnits) {
                            //         if (userBusinessUnitsError) {
                            //             res.status(400).send({
                            //                 status: false,
                            //                 message: errorHandler.getErrorMessage(userBusinessUnitsError)
                            //             });
                            //         } else {
                            //             res.json({
                            //                 status: true,
                            //                 token: token,
                            //                 businessUnits: userBusinessUnits,
                            //                 companySegments: resultUser.company.segments,
                            //                 categories: resultUser.company.category
                            //             });
                            //         }
                            //     });
                            // }
                        }
                    });
                } else {
                    res.status(400).send({
                        status: false,
                        message: 'Error finding the user with username -' + user.username
                    });
                }
            });


            // Remove sensitive data before login
            /*user.password = undefined;
             user.salt = undefined;

             req.login(user, function(err) {
             if (err) {
             res.status(400).send(err);
             } else {
             res.json({token:genToken(user.username, user.id)});
             }
             });*/
        }
    })(req, res, next);
};

/**
 * Update Device Token
 */
exports.updateDeviceToken = function (req, res) {
    var token = req.body.token || req.headers.token;
    if (token) {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (err) {
                return res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });
            }
            User.findOne({
                username: user.username
            }, '-salt -password', function (err, dbuser) {
                if (dbuser) {

                    var devicetoken = req.body.devicetoken || req.headers.devicetoken;
                    var deviceid = req.body.deviceid || req.headers.deviceid;

                    if (deviceid) {
                        for (var i = 0; i < dbuser.devices.length; i++) {
                            if (dbuser.devices[i].deviceid === deviceid) {
                                dbuser.devices[i].token = devicetoken;
                                break;
                            }
                        }

                    }

                    dbuser.updated = Date.now();
                    dbuser.save(function (err, resultUser) {
                        if (err) {
                            logger.error('Error updating the user with username -' + req.body.username);
                            //logger.debug('Error Message-'+JSON.stringify(info));
                            res.status(400).send({
                                status: false,
                                message: 'Error updating the user with username -' + req.body.username
                            });
                        } else {

                            res.status(200).send({
                                status: true,
                                message: 'Successfully Updated the device token'
                            });
                        }
                    });
                } else {
                    res.status(400).send({
                        status: false,
                        message: 'Error finding the user with username -' + user.username
                    });
                }
            });

        });
    } else {
        res.status(400).send({
            status: false,
            message: 'User is not signed in'
        });
    }
};

/**
 * Signout
 */
exports.signout = function (req, res) {
    var token = req.body.token || req.headers.token;
    if (token) {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (err) {
                return res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });
            }
            User.findOne({
                username: user.username
            }, '-salt -password', function (err, dbuser) {
                if (dbuser) {

                    var deviceid = req.body.deviceid || req.query.deviceid;

                    if (deviceid) {
                        for (var i = 0; i < dbuser.devices.length; i++) {
                            if (dbuser.devices[i].deviceid === deviceid) {
                                dbuser.devices[i].active = false;
                                break;
                            }
                        }

                    }

                    if (deviceid) {
                        for (var j = 0; j < dbuser.accountActivity.length; j++) {
                            if (dbuser.accountActivity[j].deviceid === deviceid && (!dbuser.accountActivity[j].logoutTime)) {
                                dbuser.accountActivity[j].logoutTime = Date.now();
                                dbuser.accountActivity[j].active = false;
                                break;
                            }
                        }
                    }

                    dbuser.updated = Date.now();
                    dbuser.save(function (err, resultUser) {
                        if (err) {
                            logger.error('Error updating the user with username -' + req.body.username);
                            //logger.debug('Error Message-'+JSON.stringify(info));
                            res.status(400).send({
                                status: false,
                                message: 'Error updating the user with username -' + req.body.username
                            });
                        } else {
                            if (req.body.token) {
                                delete req.body.token;
                            } else {
                                delete req.headers.token;
                            }
                            res.status(200).send({
                                status: true,
                                message: 'Successfully Logged Out'
                            });
                        }
                    });
                } else {
                    res.status(400).send({
                        status: false,
                        message: 'Error finding the user with username -' + user.username
                    });
                }
            });

        });
    } else {
        res.status(400).send({
            status: false,
            message: 'User is not signed in'
        });
    }
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
    return function (req, res, next) {
        passport.authenticate(strategy, function (err, user, redirectURL) {
            if (err || !user) {
                return res.redirect('/signin');
            }
            req.login(user, function (err) {
                if (err) {
                    return res.redirect('/signin');
                }

                return res.redirect(redirectURL || '/');
            });
        })(req, res, next);
    };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
    var token = req.body.token || req.headers.token;
    var reqUser = usersJWTUtil.isValidToken(token);
    if (!reqUser) {
        // Define a search query fields
        var searchMainProviderIdentifierField = 'providerData.' + providerUserProfile.providerIdentifierField;
        var searchAdditionalProviderIdentifierField = 'additionalProvidersData.' + providerUserProfile.provider + '.' + providerUserProfile.providerIdentifierField;

        // Define main provider search query
        var mainProviderSearchQuery = {};
        mainProviderSearchQuery.provider = providerUserProfile.provider;
        mainProviderSearchQuery[searchMainProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

        // Define additional provider search query
        var additionalProviderSearchQuery = {};
        additionalProviderSearchQuery[searchAdditionalProviderIdentifierField] = providerUserProfile.providerData[providerUserProfile.providerIdentifierField];

        // Define a search query to find existing user with current provider profile
        var searchQuery = {
            $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
        };

        User.findOne(searchQuery, function (err, user) {
            if (err) {
                return done(err);
            } else {
                if (!user) {
                    var possibleUsername = providerUserProfile.username || ((providerUserProfile.email) ? providerUserProfile.email.split('@')[0] : '');

                    User.findUniqueUsername(possibleUsername, null, function (availableUsername) {
                        user = new User({
                            firstName: providerUserProfile.firstName,
                            lastName: providerUserProfile.lastName,
                            username: availableUsername,
                            displayName: providerUserProfile.displayName,
                            email: providerUserProfile.email,
                            provider: providerUserProfile.provider,
                            providerData: providerUserProfile.providerData
                        });

                        // And save the user
                        user.save(function (err) {
                            return done(err, user);
                        });
                    });
                } else {
                    return done(err, user);
                }
            }
        });
    } else {
        // User is already logged in, join the provider data to the existing user
        usersJWTUtil.findUserByToken(token, function (err, user) {
            // Check if user exists, is not signed in using this provider, and doesn't have that provider data already configured
            if (user.provider !== providerUserProfile.provider && (!user.additionalProvidersData || !user.additionalProvidersData[providerUserProfile.provider])) {
                // Add the provider data to the additional provider data field
                if (!user.additionalProvidersData) user.additionalProvidersData = {};
                user.additionalProvidersData[providerUserProfile.provider] = providerUserProfile.providerData;

                // Then tell mongoose that we've updated the additionalProvidersData field
                user.markModified('additionalProvidersData');

                // And save the user
                user.save(function (err) {
                    return done(err, user, '/settings/accounts');
                });
            } else {
                return done(new Error('User is already connected using this provider'), user);
            }
        });
    }
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
    var provider = req.param('provider');
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                status: false,
                message: errorHandler.getErrorMessage(err)
            });
        }
        if (user && provider) {
            // Delete the additional provider
            if (user.additionalProvidersData[provider]) {
                delete user.additionalProvidersData[provider];

                // Then tell mongoose that we've updated the additionalProvidersData field
                user.markModified('additionalProvidersData');
            }

            user.save(function (err) {
                if (err) {
                    return res.status(400).send({
                        status: false,
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    res.json({ status: true, token: usersJWTUtil.genToken(user.username, user.id) });
                }
            });
        }
    });
};


exports.presignup = function (req, res, next) {
    //logger.debug('Pre-Signup Registration Request - '+JSON.stringify(req.body));
    logger.debug('Registering User');
    async.waterfall([
        // Generate random token
        function (done) {
            crypto.randomBytes(20, function (err, buffer) {
                var token = buffer.toString('hex');
                var otp;
                if (req.body.useMobileAsUserName) {
                    otp = notp.totp.gen(K, {});
                }
                //TODO: The below line Needs to be commented.
                //logger.debug('OTP-' + otp);
                done(err, token, otp);
                logger.debug('Started otp:' + otp);
            });
        },
        // Lookup user by username
        function (token, otp, done) {
            if (req.body.username) {
                var array = [];
                array.push({ username: req.body.username });
                if (req.body.email) {
                    array.push({ email: req.body.email });
                }
                if (req.body.mobile) {
                    array.push({ mobile: req.body.mobile });
                }
                User.findOne({ $or: array }, '-salt -password', function (err, user) {
                    if (user === null || !user.company) {
                        if (req.body.password === req.body.ConfirmPassword) {
                            if (!req.body.companyName) {
                                return res.status(400).send({
                                    status: false,
                                    message: 'Company Name field must not be blank'
                                });
                            } else if (!req.body.businessType) {
                                return res.status(400).send({
                                    status: false,
                                    message: 'Business Type field must not be blank'
                                });
                            } else if ((!req.body.categorySeller && !req.body.categoryBuyer && !req.body.categoryMediator) || (req.body.categorySeller === false && req.body.categoryBuyer === false && req.body.categoryMediator === false)) {
                                return res.status(400).send({
                                    status: false,
                                    message: 'One of the Business Category needs to be selected'
                                });
                            } else {

                                Company.findOne({
                                    name: new RegExp(req.body.companyName, 'i')
                                }, function (errCompany, dbCompany) {
                                    if (dbCompany) {
                                        return res.status(400).send({
                                            status: false,
                                            message: 'The company with the name -' + req.body.companyName + ' is already registered. Please contact info@invipani.com'
                                        });
                                    } else {
                                        var reqUser = new User(req.body);
                                        if (user !== null) {
                                            reqUser = _.extend(user, req.body);
                                        }
                                        /*reqUser.firstName = req.body.firstName;
                                         reqUser.lastName = req.body.lastName;
                                         reqUser.middleName = req.body.middleName;*/
                                        reqUser.displayName = reqUser.firstName + (reqUser.lastName ? ' ' + reqUser.lastName : '') + (reqUser.middleName ? ' ' + reqUser.middleName : '');
                                        reqUser.email = req.body.email;
                                        reqUser.username = req.body.username;
                                        reqUser.mobile = req.body.mobile;
                                        reqUser.statusToken = token;
                                        reqUser.otp = otp;
                                        reqUser.devices = [];
                                        reqUser.devices = [];
                                        reqUser.allowRegistration = true;
                                        reqUser.serverUrl = req.protocol + '://' + req.headers.host;
                                        reqUser.provider = 'local';
                                        reqUser.status = 'Register Request';
                                        reqUser.updated = Date.now();

                                        if (reqUser.allowRegistration) {
                                            reqUser.registerOption = false;
                                        } else {
                                            reqUser.registerOption = true;
                                        }
                                        reqUser.save(function (err) {
                                            if (err) {
                                                return res.status(400).send({
                                                    status: false,
                                                    message: errorHandler.getErrorMessage(err)
                                                });
                                            }

                                            var company = new Company();

                                            company.name = req.body.companyName;
                                            var str = req.body.companyName;
                                            company.profileUrl = str.replace(/\s+/g, '-').toLowerCase();
                                            company.user = reqUser._id;
                                            /*company.businessType = req.body.businessType;
                                            company.category.seller = req.body.categorySeller;
                                            company.category.buyer = req.body.categoryBuyer;
                                            company.category.mediator = req.body.categoryMediator;*/
                                            if (reqUser.email) {
                                                company.emails = [];
                                                company.emails.push({
                                                    email: reqUser.email,
                                                    emailType: 'Work',
                                                    primary: true
                                                });
                                            }
                                            if (reqUser.mobile) {
                                                company.phones = [];
                                                company.phones.push({
                                                    phoneNumber: reqUser.mobile,
                                                    phoneType: 'Mobile',
                                                    primary: true
                                                });
                                            }
                                            company.updateHistory = [];
                                            company.updateHistory.push({
                                                modifiedOn: Date.now(),
                                                modifiedBy: company.user
                                            });
                                            company.save(function (companyErr) {
                                                if (companyErr) {
                                                    return res.status(400).send({
                                                        status: false,
                                                        message: errorHandler.getErrorMessage(companyErr)
                                                    });
                                                } else {
                                                    User.findOne({
                                                        username: reqUser.username
                                                    }, '-salt -password', function (err, dbuser) {
                                                        dbuser = _.extend(dbuser, {});
                                                        dbuser.company = company._id;

                                                        dbuser.save(function (userErr) {
                                                            if (userErr) {
                                                                return res.status(400).send({
                                                                    status: false,
                                                                    message: errorHandler.getErrorMessage(userErr)
                                                                });
                                                            } else {
                                                                if (reqUser.allowRegistration) {
                                                                    done(err, token, otp, reqUser);
                                                                } else {
                                                                    done(err, null, null, reqUser);
                                                                }
                                                            }
                                                        });
                                                    });
                                                }
                                            });
                                        });
                                    }
                                });
                            }
                        } else {
                            return res.status(400).send({
                                status: false,
                                message: 'Passwords do not match'
                            });
                        }
                    } else {
                        var mailContent;
                        if (req.body.email && req.body.mobile) {
                            mailContent = 'Email ' + req.body.email + ' or Mobile ' + req.body.mobile + ' is already registered';
                        } else if (req.body.email) {
                            mailContent = 'Email ' + req.body.email + ' is already registered';
                        } else if (req.body.mobile) {
                            mailContent = 'Mobile ' + req.body.mobile + ' is already registered';
                        }
                        return res.status(400).send({
                            status: false,
                            message: mailContent
                        });
                    }
                });

            } else {
                return res.status(400).send({
                    status: false,
                    message: 'Username (Email/Mobile) field must not be blank'
                });
            }
        },

        function (token, otp, user, done) {
            /*if(otp) {
             res.render('templates/user-otpactivation', {
             success: true,
             url: req.headers.host,
             username: user.username,
             successMessage: 'An OTP has been sent to ' + user.username+'. Please enter the same.'
             });
             } else */
            if (otp) {
                done(null, null, otp, user);
            } else if (token) {
                res.render('templates/user-registration', {
                    name: 'Customer',
                    appName: config.app.title,
                    url: req.protocol + '://' + req.headers.host + '/user/register/' + token
                }, function (err, emailHTML) {
                    done(err, emailHTML, otp, user);
                });
            } else {
                res.render('templates/user-restrict', {
                    name: 'Customer',
                    appName: config.app.title
                }, function (err, emailHTML) {
                    done(err, emailHTML, otp, user);
                });
            }
        },
        // If valid email, send reset email using service
        function (emailHTML, otp, user, done) {
            if (process.env.NODE_ENV === 'test') {
                res.send({
                    status: true,
                    message: 'An email has been sent to ' + user.username + ' with further instructions.'
                });
                done();
            } else {
                logger.debug('Sending SMS Response-' + otp);
                if (req.body.useMobileAsUserName) {
                    sms.sendOTP(req.body.mobile, otp, function (err, response) {
                        if (!err) {
                            logger.debug('Sending SMS Response-' + response);
                            if (process.env.NODE_ENV === 'development' || (!config.production)) {
                                //if((!config.production)) {
                                res.send({
                                    status: true,
                                    statusToken: user.statusToken,
                                    message: 'An OTP has been sent to ' + user.username + '. ' + otp + ' is your One Time Password (OTP)'
                                });
                            } else {
                                var smtpTransport = nodemailer.createTransport(config.mailer.options);
                                var mailOptions = {
                                    to: config.nvipaniAdminUsers,
                                    from: config.mailer.from,
                                    subject: 'Registration Request for ' + user.username,
                                    html: 'User FirstName:' + user.firstName + ', LastName :' + user.lastName + ', user Name:' + user.username + ', OTP :' + otp,
                                };
                                /* if (config.production && user.allowRegistration) {
                                     mailOptions.bcc = config.nvipaniAdminUsers;
                                 }*/
                                smtpTransport.sendMail(mailOptions, function (err) {
                                    if (err) {
                                        res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(err),
                                        });
                                    }
                                    if (!err) {
                                        res.send({
                                            status: true,
                                            statusToken: user.statusToken,
                                            message: 'An OTP has been sent to ' + user.username
                                        });
                                    }

                                    /*done(err);*/
                                });

                            }
                        } else {
                            res.status(400).send({
                                status: false,
                                message: errorHandler.getErrorMessage(err),
                            });
                        }
                    });
                } else {
                    res.render('templates/user-registration', {
                        name: 'Customer',
                        appName: config.app.title,
                        url: req.protocol + '://' + req.headers.host + '/user/register/' + user.statusToken
                    }, function (err, emailHTML) {
                        var smtpTransport = nodemailer.createTransport(config.mailer.options);
                        var mailOptions = {
                            to: user.username,
                            from: config.mailer.from,
                            subject: 'Registration Request',
                            html: emailHTML,
                        };
                        if (config.production && user.allowRegistration) {
                            mailOptions.bcc = config.nvipaniAdminUsers;
                        }
                        smtpTransport.sendMail(mailOptions, function (err) {
                            if (err) {
                                res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(err)
                                });
                            }
                            if (!err) {
                                res.send({
                                    status: true,
                                    message: 'An email has been sent to ' + user.username + ' with further instructions.'
                                });
                            }

                            /*done(err);*/
                        });
                    });

                }
            }
        }
    ], function (err) {
        if (err) return next(err);
        /*else return res.status(400).send({
         status:true,
         message: req.body.username + ' sucessfully registered'
         });*/
    });
};
var getUserRegistrationCategory = function (done) {
    RegistrationCategory.find({ isDefault: true }).exec(function (registrationFindErr, registrationTypes) {
        if (registrationFindErr) {
            done(registrationFindErr);
        } else {
            done(null, registrationTypes);
        }
    });
};
function getBusinessSegmentsCategories(done) {
    BusinessSegments.find().populate('categories.category').exec(function (businessErr, businessSegments) {
        if (businessErr) {
            done(businessErr, null);
        } else {
            dbUtil.findQueryByCategories([{ type: 'SubCategory1' }], 1, function (errCat, categories) {
                getUserRegistrationCategory(function (nVipaniUserRegistrationCategoryUpdateErr, registrationCategories) {
                    if (nVipaniUserRegistrationCategoryUpdateErr)
                        done(nVipaniUserRegistrationCategoryUpdateErr, businessSegments, categories, null);
                    else {
                        done(nVipaniUserRegistrationCategoryUpdateErr, businessSegments, categories, registrationCategories);
                    }
                });

            });
        }

    });
}

function getUserInputValidation(data, done) {
    // var reg = /^(?:\d{10,11}|([_a-zA-Z0-9]+(\.[_a-zA-Z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})))$/;
    var reg = /^\w+([\.-]?\w+)*@(nvipani.com)/;
    console.log(data.issendemail, 'inputvlaidation');

    if (!data) {
        console.log(1, 'inputvlaidation');
        done(new Error('Username (Email/Mobile) field must not be blank'), null);
    }
    else if (data.issendotp && data.issendemail) {
        console.log(2, 'inputvlaidation', !reg.test(data.username));
        if (!data.username) {
            logger.error('username is empty :' + JSON.stringify(data));
            done(new Error('Username (Email/Mobile) field must not be blank'), null);
        } else if(data.username && data.issendotp && data.issendemail) {
            if(!reg.test(data.username)){
                logger.error('Username is not valid' + JSON.stringify(data));
                done(new Error('Username is not valid, Enter valid Email/Phone'), null);
            }else{
                console.log('come here finallyss');
                
                logger.debug('Username is valid');
                done(null, data);
            }           
        }
    } 
     else if (data.isverifyotp) {
        console.log(3, 'inputvlaidation');
        if (!data.otp) {
            logger.error('OTP field is empty');
            done(new Error('OTP field is empty for user ' + data.username), null);
        } 
        else if (!data.password || !data.conf_password) {
            logger.error('Password is empty : ' + JSON.stringify(data));
            done(new Error('Password field must not be blank'), null);
        }
        else if (data.password.trim().length < 8) {
            logger.error('Password is not valid +' + JSON.stringify(data));
            done(new Error('Password is less than 8 chars'), null);
        } else if (data.password.trim() !== data.conf_password.trim()) {
            logger.error('Password and Confirm Password is not valid +' + JSON.stringify(data));
            done(new Error('Password and Confirm Password must be equal'), null);
        }
        else {
            done(null, data);
        }
    }
    // else {
    //     done(null, data);
    // }
    // else if (data.issendotp && !data.issendemail) {
    //     console.log(2, 'inputvlaidation');
    //     if (!data.username) {
    //         logger.error('username is empty :' + JSON.stringify(data));
    //         done(new Error('Username (Email/Mobile) field must not be blank'), null);
    //     } else {
    //         if (!reg.test(data.username)) {
    //             logger.error('Username is not valid' + JSON.stringify(data));
    //             done(new Error('Username is not valid, Enter valid Email/Phone'), null);
    //         } else {
    //             logger.debug('Username is valid');
    //             if (!data.password) {
    //                 logger.error('Password is empty :' + JSON.stringify(data));
    //                 done(new Error('Password field must not be blank for the user :' + data.username), null);
    //             }
    //             else {
    //                 if (data.password.trim().length < 8) {
    //                     logger.error('Password is not valid +' + JSON.stringify(data));
    //                     done(new Error('Password is less than 8 chars'), null);
    //                 } else if (data.password !== data.conf_password) {
    //                     logger.error('Password and Confirm Password is not valid +' + JSON.stringify(data));
    //                     done(new Error('Password and Confirm Password must be equal'), null);
    //                 }
    //                 else {
    //                     logger.debug('Password is valid');
    //                     done(null, data);
    //                 }
    //             }
    //         }
    //     }
    // }
   
    // else if (data.ispassword) {
    //     console.log(4, 'inputvlaidation');
    //     if (!data.registrationCategory) {
    //         logger.error('No registration category found for the user :' + data.username);
    //         done(new Error('No registration category found for the user :' + data.username), null);
    //     }
    //     else {
    //         if (!data.selectedSegments || (data.selectedSegments && data.selectedSegments.length === 0)) {
    //             logger.error('No segments found for the Registration category :' + data.registrationCategory + 'for the user :' + data.username);
    //             // done(new Error('No segments found for the category :'+ data.registrationCategory + 'for the user :' +data.username),null);
    //             done(new Error('No segments found for the user :' + data.username), null);
    //         } else if (data.selectedSegments && data.selectedSegments.length > 0 && data.selectedSegments.filter(function (eachSegment) {
    //             return ((data.selectedSegments.length === 1 && eachSegment.isSpecific) || !eachSegment.isSpecific) && (!eachSegment.categories || (eachSegment.categories && eachSegment.categories.length === 0));
    //         }).length > 0) {
    //             logger.error('No Categories  found for the selected Segments for the user :' + data.username + ' with the registration Category :' + data.registrationCategory);
    //             // done(new Error('No segments found for the category :'+ data.registrationCategory + 'for the user :' +data.username),null);
    //             done(new Error('No Categories  found for the selected Segments for the user :' + data.username), null);
    //         }
    //         else {
    //             done(null, data);
    //         }
    //     }
    // }
   

    
}
function findUser(query, done) {
    User.findOne({ $or: query }).select('username email mobile emailVerified mobileVerified otp emailOtp company status').populate('company', 'categories segments registrationCategory').exec(function (err, user) {
        done(err, user);

    });
}
function findUsernameField(userName, done) {
    if (userName) {
        var expMail = new RegExp(config.emailRegEx);
        var expPhone = new RegExp(config.phoneEx);
        done(null, expMail.test(userName), expPhone.test(userName));
    } else {
        done(new Error('No proper user name type field'), false, false);
    }
}
function findOrRegisterUser(data, done) {
    if (data.username) {
        var array = [];
        array.push({ username: data.username });
        logger.debug('Check whether user name is Email or phone number');
        findUsernameField(data.username, function (err, isEmail, isPhone) {
            if (err) {
                done(err, null, null);
            } else if (isEmail || isPhone) {
                if (isEmail) {
                    logger.debug('Email is :' + data.username);
                    data.isEmail = true;
                    array.push({ email: data.username });
                }
                if (isPhone) {
                    logger.debug('Phone number is :' + data.username);
                    array.push({ mobile: data.username });
                    data.isPhone = true;
                }
                logger.debug('Fetch matched  user with user name :' + data.username);
                userUtil.getQueryByUser({ $or: array }, 2, function (err, user) {
                      if (err) {
                        logger.error('Failed to load user with the username : ' + data.username + ' Error' + errorHandler.getErrorMessage(err));
                        done(err, data, user);
                    } else if (!user) {
                        logger.error('No user found with the username : ' + data.username);
                        logger.error('No user found with the username : ' + err, data, user);
                        done(err, data, user);
                    } else {
                        logger.debug('Found user with the username :' + data.username);
                        if (user.deleted === true) {
                            logger.error('User is already Registered and deleted,so it is not possible to register');
                            done(new Error('Not allow to register. Please contact customer care.'), null, null);
                        } else if (user.status === 'Register Request' && user.userType === 'Employee') {
                            logger.error('User is already used for some other company as employee');
                            done(new Error('User is already used for some other company as employee'), null, null);
                        } else if (user.status === 'Registered') {
                            logger.error('User is already Registered');
                            done(new Error('User is already Registered'), null, null);
                        } else {
                            done(err, data, user);
                        }
                    }

                });
            } else {
                logger.error('Username  must be  valid Email/Mobile number ');
                done(new Error('No proper username input username: ' + data.username), null, null);
            }
        });
    } else {
        logger.error('No Valid input for user Registration ' + JSON.stringify(data));
        done(new Error('Username (Email/Mobile) field must not be blank'), null, null);
    }
}
function getEmailTemplate(user, type, req) {
    let a = '';
    a = new Buffer(user.username).toString('base64');
    console.log(user, type, 'from sendnotifcation fn');

    if (type === 'Registered') {
        return {
            template: 'templates/success-user', subject: 'You are successfully Activated', options: {
                name: 'Customer',
                appName: config.app.title,
                otp: user.emailOtp,
                baseUrl: req.protocol + '://' + req.headers.host,
                username: user.username
            }
        };
    } else if (type === 'Register Request') {
        return {
            template: 'templates/user-registration', subject: 'Registration Request', options: {
                name: 'Customer',
                appName: config.app.title,
                otp: user.emailOtp,
                hyperlink: req.protocol + '://' + 'localhost:4200/confirm/true/' + user.username + '/' + user.emailOtp,  // Newly added
                baseUrl: req.protocol + '://' + req.headers.host,
                username: user.username
            }
        };
    } else {
        return { template: 'templates/user-registration', subject: 'Activated', options: {} };
    }
}

function sendRegistrationNotification(user, data, type, req, res, done) {
    logger.debug('Sending OTP Response');

    if ((user && data.isEmail && config.sendEmail) || (data.isPhone && config.sendSMS)) {
        if (data.isEmail) {
            var emailTemplate = getEmailTemplate(user, type, req);

            res.render(emailTemplate.template, emailTemplate.options, function (err, emailHTML) {
                var smtpTransport = nodemailer.createTransport(config.mailer.options);
                var mailOptions = {
                    to: 'rambabu.e@technoxis.in', // user.username,  
                    from: config.mailer.from,
                    subject: emailTemplate.subject,
                    html: emailHTML
                };
                if (config.production) {
                    mailOptions.bcc = config.nvipaniAdminUsers;
                }
                logger.debug('Sending OTP Response-' + user.emailOtp);
                smtpTransport.sendMail(mailOptions, function (err) {
                    if (err) {
                        /*res.status(400).send({
                            status: false,
                            message: errorHandler.getErrorMessage(err)
                        });*/
                        done(err, null);
                    }
                    if (!err) {
                        done(null, user);
                    }

                });
            });


        } else {
            sms.sendOTP(user.username, user.otp, function (errOtp, response) {
                if (!errOtp) {
                    logger.debug('Sending SMS Response-' + response);

                    var smtpTransport = nodemailer.createTransport(config.mailer.options);
                    var mailOptions = {
                        to: config.nvipaniAdminUsers,
                        from: config.mailer.from,
                        subject: user.status === 'Registered' ? 'Activated ' + user.username : 'Registration Request for ' + user.username,
                        html: 'An OTP has been sent to ' + user.username + '. ' + user.otp + ' is your One Time Password (OTP)'
                    };
                    smtpTransport.sendMail(mailOptions, function (err) {
                        if (err) {
                            done(err, null);
                        }
                        if (!err) {
                            done(null, user);
                        }

                    });

                } else {
                    done(errOtp, null);
                }
            });

        }
    } else {
        done(null, user);
    }
}
function hashPassword(password, salt) {
    if (password && salt) {
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1').toString('base64');
    } else {
        return password;
    }
}
function userCompanyInformation(user, data, done) {
    Company.findOne({
        name: new RegExp(data.companyName ? data.companyName : user.username, 'i')
    }, function (errCompany, dbCompany) {
        if (dbCompany) {
            logger.error('Some has already registered with the company name - ' + dbCompany.name + '. Please contact info@nvipani.com');
            done(new Error('Someone has already registered with the company name - ' + dbCompany.name + '. Please contact info@invipani.com'), null);
        } else {
            var company = new Company();
            company.segments = data.selectedSegments;
            company.name = data.companyName ? data.companyName : user.username;
            var str = data.companyName ? data.companyName : user.username;
            company.isPredefined = !data.companyName;
            company.profileUrl = str.replace(/\s+/g, '-').toLowerCase();
            company.user = user._id;
            company.registrationCategory = data.registrationCategory;
            if (user.email && user.email.length > 0) {
                company.emails = [];
                company.emails.push({
                    email: user.email,
                    emailType: 'Work',
                    primary: true
                });
            }
            if (user.mobile && user.mobile.length > 0) {
                company.phones = [];
                company.phones.push({
                    phoneNumber: user.mobile,
                    phoneType: 'Mobile',
                    primary: true
                });
            }
            company.updateHistory = [];
            company.updateHistory.push({
                modifiedOn: Date.now(),
                modifiedBy: company.user
            });
            company.save(function (companyErr) {
                if (companyErr) {
                    done(companyErr, null);
                    /*return res.status(400).send({
                        status: false,
                        message: errorHandler.getErrorMessage(companyErr)
                    });*/
                } else {
                    companyUtil.findUserGroupByName('Admin', function (groupErr, groupByName) {
                        if (groupErr) {
                            logger.error('Error while for user group Admin :' + errorHandler.getErrorMessage(groupErr));
                            done(groupErr, null);
                        } else {
                            user.status = 'Registered';
                            user.company = company._id;
                            user.companies = [];
                            user.companies.push({
                                company: company._id,
                                userGroup: groupByName._id
                            });
                            user.save(function (err) {
                                if (err) {
                                    /* return res.status(400).send({
                                         status: false,
                                         message: errorHandler.getErrorMessage(err)
                                     });*/
                                    done(err, null);
                                } else {
                                    createCompanyContactWhileRegister(user, function (err) {
                                        if (err) {
                                            done(err, null);
                                        } else {
                                            userUtil.updateContactWithnVipaniUser(user, function (nVipaniUserUpdateErr) {
                                                if (nVipaniUserUpdateErr) {
                                                    done(nVipaniUserUpdateErr, null);
                                                } else {
                                                    done(null, user);
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}
function userRegistrationProcess(user, data, done) {
    console.log(data,'userRegistrationProcess function called');
    console.log(user.emailOtp);
    console.log(user.emailVerified);

    if ((data.isEmail || data.isPhone)) {
        if (user.status === 'Register Request') {
            if (data.isverifyotp) {
                logger.debug('Verifying OTP - ' + data.isverifyotp);
                if ((data.isEmail && data.otp === user.emailOtp && !user.emailVerified) || (!user.mobileVerified && data.isPhone && data.otp === user.otp)) {
                    var dbuser = _.extend(user, {});
                    dbuser.updated = Date.now();
                    dbuser.status = 'Registered';
                    if (data.isEmail) {
                        logger.debug('Email - ' + dbuser.username + ' is verified');
                        dbuser.emailVerified = true;
                    } else {
                        logger.debug('Mobile - ' + dbuser.username + ' is verified');
                        dbuser.mobileVerified = true;
                    }
                    if (dbuser.allowRegistration) {
                        dbuser.registerOption = false;
                    } else {
                        dbuser.registerOption = true;
                    }
                    if (data.conf_password) {
                     //   globalUtil.populateDisplayName(user, function (displayname) {
                         
                            dbuser.displayName = data.username;
                            if (data.password && data.password.length > 6) {
                                let salt;
                               // salt = (crypto.randomBytes(16));
                               salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');

                                dbuser.salt = salt;
                                dbuser.password = dbuser.hashPassword(data.password);
                               
      
                                if (user.profileImageURL) {
                                    var fileName = user.profileImageURL.substring(0, user.profileImageURL.lastIndexOf('.'));

                                    var croppedProfileImageURL = fileName + '-resize-240-240.png';

                                    if (user.croppedProfileImageURL !== croppedProfileImageURL) {
                                        dbuser.croppedProfileImageURL = croppedProfileImageURL;
                                    }
                                }


                                //this.userCategory.enumValues=this.fieldProperties('userCategory','enum');
                            }
                            
                     //   });
                         
                    }
                    /**
                     * Create instance method for authenticating user
                     */
                    // UserSchema.methods.authenticate = function (password) {
                    //     return this.password === this.hashPassword(password);
                    // };
                    dbuser.save(function (userErr) {
                        if (userErr) {
                            done(userErr, null);
                        } else {
                            done(null, dbuser);
                        }
                    });

                } else {
                    if (data.isEmail) {
                        logger.error('Incorrect otp for the Email: ' + user.username);
                        done(new Error('Incorrect otp for the Email: ' + user.username), null);
                    } else {
                        logger.error('Incorrect otp for the Mobile: ' + user.username);
                        done(new Error('Incorrect otp for the Mobile: ' + user.username), null);
                    }
                }
            } else if (data.ispassword) {
                if (data.isEmail) {
                    done(new Error('OTP is not Verified for the Email: ' + user.username), null);
                } else {
                    done(new Error('OTP is not Verified for the Mobile : ' + user.username), null);
                }
            } else if (data.issendotp) {
                done(null, user);
            } else {
                if (data.isEmail) {
                    done(new Error('OTP is not Verified for the Email: ' + user.username), null);
                } else {
                    done(new Error('OTP is not Verified for the Mobile : ' + user.username), null);
                }
            }
        } else if (user.status === 'Verified') {
            if (data.ispassword) {
                userCompanyInformation(user, data, function (companyErr, user) {
                    done(companyErr, user);
                });
            } else if (data.issendotp) {
                done(null, user);
            } else {
                done(null, user);
            }

        } else {
            logger.error('No Proper user input for Registration');
            done(new Error('No Proper user input for Registration'), null);
        }
    } else {
        logger.error('No Proper user input for Registration');
        done(new Error('No Proper user input for Registration'), null);
    }

}
function getMessage(user, data) {
    if (user.status === 'Register Request') {
        if (data.isEmail) {

            /*isEmail ? (user.status === 'Register Request' ? 'An OTP has been sent to ' + user.username + '. ' + user.emailOtp + ' is your One Time Password (OTP)' : 'An OTP has been ' + user.status + ' for the ' + user.username) : user.status === 'Register Request' ? 'An OTP has been sent to ' + user.username + '. ' + otp + ' is your One Time Password (OTP)' : 'An OTP has been ' + user.status + ' for the ' + user.username
*/
            if (config.sendEmail) {
                return 'An OTP has been sent to Email :' + user.username + '. ' + user.emailOtp + ' is your One Time Password (OTP)';
            } else {
                return 'An OTP has been sent to Email :' + user.username + '. ' + user.emailOtp + ' is your One Time Password (OTP)';
            }
        } else {

            //     message: user.status === 'Register Request' ? 'An OTP has been sent to ' + user.username + '. ' + otp + ' is your One Time Password (OTP)' : 'An OTP has been ' + user.status + ' for the ' + user.username

            if (config.sendSMS) {
                return 'An OTP has been sent to Phone : ' + user.username;
            } else {
                return 'An OTP has been sent to Phone :' + user.username + '. ' + user.otp + ' is your One Time Password (OTP)';
            }

        }
    } else if (user.status === 'Verified') {
        if (data.issendotp) {
            return 'User is already verified :' + user.username;
        } else if (data.isverifyotp) {
            return 'User is verified :' + user.username;
        }
    }
    else if (user.status === 'Registered') {
        if (user.company) {
            logger.debug('User is successfully registered');
            return 'User is successfully registered';
        }else{
            // logger.debug('User is successfully registered');
            // return 'User is successfully registered';
        }
    }

}
  
function hasAuthorization(token, done) {
    var token = token;
console.log('hasAuthorization called');

    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            done(new Error('User is not authorized'), false, false);
        } else {
            if(user.userType == config.authType || user.userType == config.authType1){
                done(null,user)
            }else{
                 done(new Error('User is not authorized'), false, false);  
            }
            
        }
    });

};


exports.userRegistration = function (req, res) {
    logger.debug('Registration Request  - ' + JSON.stringify(req.body));
    var data = req.body;
    var token, otp;
    console.log(data, 'before going to getUserInputValidation');

    logger.debug('user registration input validation for the data :' + JSON.stringify(data));
    getUserInputValidation(data, function (validError, data) {
        if (validError) {
            return res.status(400).send({
                status: false,
                message: errorHandler.getErrorMessage(validError)
            });
        } else {
            logger.debug('Fetching already created user with the same user name  :' + data.username);
            findOrRegisterUser(data, function (userRegErr, data, user) {
                if (userRegErr) {
                    console.log('error occuered in findOrRegisterUser');
 
                    return res.status(400).send({
                        status: false,
                        message: errorHandler.getErrorMessage(userRegErr)
                    });
                } else {
                    if (user instanceof User) {
                        logger.debug('instance of user  :' + user);
                        console.log('no error occuered in findOrRegisterUser');
                        userRegistrationProcess(user, data, function (userErr, user) {
                            logger.debug('user registered  :' + user);
                            console.log('user registered  :' + user);
                            if (userErr) {
                                return res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(userErr)
                                });
                            } else {
                                if (user.status === 'Register Request') {
                                    if (data.issendotp) {
                                        sendRegistrationNotification(user, data, user.status, req, res, function (sendEmailErr, user) {
                                            if (sendEmailErr) {
                                                return res.status(400).send({
                                                    status: false,
                                                    message: errorHandler.getErrorMessage(sendEmailErr)
                                                });
                                            } else if (!user) {
                                                return res.status(400).send({
                                                    status: false,
                                                    message: 'No user for send Mail'
                                                });
                                            } else {
                                                res.send({
                                                    status: true,
                                                    otp: data.isEmail ? user.emailOtp : user.otp,
                                                    user: user,
                                                    message: getMessage(user, data)

                                                });

                                            }
                                        });
                                    }
                                } 
                                
                                else if (user.status === 'Verified') {
                                    getBusinessSegmentsCategories(function (nVipaniUserRegistrationCategoryUpdateErr, segments, categories, registrationCategories) {
                                        if (nVipaniUserRegistrationCategoryUpdateErr) {
                                            logger.error('Error in updating Registration Categories for user ' + user.username);
                                            return res.status(400).send({
                                                status: false,
                                                message: errorHandler.getErrorMessage(nVipaniUserRegistrationCategoryUpdateErr)
                                            });
                                        } else {
                                            if (data.issendotp) {
                                                return res.status(400).send({
                                                    status: false,
                                                    otp: data.isEmail ? user.emailOtp : user.otp,
                                                    user: user,
                                                    categories: categories,
                                                    segments: segments,
                                                    registrationCategories: registrationCategories,
                                                    message: getMessage(user, data)
                                                });

                                            } else if (data.isverifyotp) {
                                                res.send({
                                                    status: true,
                                                    otp: data.isEmail ? user.emailOtp : user.otp,
                                                    user: user,
                                                    categories: categories,
                                                    segments: segments,
                                                    registrationCategories: registrationCategories,
                                                    message: getMessage(user, data)
                                                });
                                            }
                                        }

                                    });


                                } else {
                                    sendRegistrationNotification(user, data, user.status, req, res, function (sendEmailErr, user) {
                                        if (sendEmailErr) {
                                            return res.status(400).send({
                                                status: false,
                                                message: errorHandler.getErrorMessage(sendEmailErr)
                                            });
                                        } else if (!user) {
                                            return res.status(400).send({
                                                status: false,
                                                message: 'No user for send Mail'
                                            });
                                        } else {
                                            res.send({
                                                status: true,
                                                user: user,
                                                message: getMessage(user, data)

                                            });

                                        }
                                    });

                                }
                            }
                        });

                    } else {
                        var usertoken = req.body.token || req.headers.token;
                        hasAuthorization(usertoken,function(err,result){
                            if(err){
                                return res.status(400).send({
                                    status: false,
                                    message: 'User is not Authorized'
                                });
                            }else{
                                logger.debug('user registered wiht valid authoenticaiton :' + result.username);
                                if (data.issendotp) {
                                    var reqUser = new User(data);
                                    crypto.randomBytes(20, function (err, buffer) {
                                        token = buffer.toString('hex');
                                        otp = notp.totp.gen(K, {});
                                        if (data.isEmail) {
                                            reqUser.email = data.username;
                                            reqUser.emailOtp = otp;
        
                                        } if (data.isPhone) {
                                            reqUser.mobile = data.username;
                                            reqUser.otp = otp;
                                        }
                                        reqUser.username = data.username;
                                        //reqUser.firstName = data.username;
                                        /*reqUser.statusToken = token;*/
                                        reqUser.devices = [];
                                        reqUser.devices = [];
                                        reqUser.allowRegistration = true;
                                        /*reqUser.acceptTerms=data.user.acceptTerms;*/
                                        reqUser.serverUrl = req.protocol + '://' + req.headers.host;
                                        reqUser.provider = 'local';
                                        reqUser.status = 'Register Request';
                                        reqUser.updated = Date.now();
                                        if( result.userType === 'Adminuser'){
                                         reqUser.userType = 'User';
                                        }else if(result.userType === 'Admin'){
                                         reqUser.userType = 'Adminuser';
                                        }else{

                                        }
                                        reqUser.created_by = result._id;
                                        
                                        reqUser.save(function (err) {
                                            if (err) {
                                                console.log('error occuered in saving');
                                                return res.status(400).send({
                                                    status: false,
                                                    message: errorHandler.getErrorMessage(err)
                                                });
                                            } else {
                                                
                                                sendRegistrationNotification(reqUser, data, 'Register Request', req, res, function (sendEmailErr, user) {
                                                    if (sendEmailErr) {
                                                        return res.status(400).send({
                                                            status: false,
                                                            message: errorHandler.getErrorMessage(sendEmailErr)
                                                        });
                                                    } else if (!user) {
                                                        return res.status(400).send({
                                                            status: false,
                                                            message: 'No user for send Mail'
                                                        });
                                                    } else {
                                                        res.send({
                                                            status: true,
                                                            otp: data.isEmail ? user.emailOtp : user.otp,
                                                            user: user,
                                                            message: getMessage(user, data)
        
                                                        });
        
                                                    }
                                                });
                                            }
                                        });
        
                                    });
        
        
                                }
                                else {
                                    logger.error('User is not registered properly' + data);
                                    return res.status(400).send({
                                        status: false,
                                        message: 'User is not registered properly'
                                    });
                                }
                            }
                           
                        })
                       
                    }
                }

            });
        }
    });

};

exports.sendPasswordLink = function (req,res){
let data = req.body;
findUserById(data.id, function (userError, user) {
    if (userError) {
        logger.error('Employee is not found in users ' + eachCompanyEmployee);
        done(userError, null, null);
    } else {
         
            var K = '12345678901234567890';
            var otp= notp.totp.gen(K, {});
            logger.debug('Started otp:'+otp);
            
            user.resetPasswordToken = otp;
            user.resetPasswordExpires = Date.now() + 120000; // 1 hour -3600000
            user.save(function (err,user1) {
                if(err){
                    res.send({
                        status: false,
                        //resetPasswordToken: user.resetPasswordToken,
                        message: 'Unable to send email to ' + err
                    });
                }else {
                    var smtpTransport = nodemailer.createTransport(config.mailer.options);
                    res.render('templates/reset-password-email', {
                        name: user.displayName,
                        appName: config.app.title,
                      // url: req.protocol + '://' + req.headers.host + '/auth/reset/' + user.resetPasswordToken,
                        url: req.protocol + '://' + 'localhost:4200/reset/' + user1.username+'/'+user1.resetPasswordToken+'/'+user1.resetPasswordExpires  // Newly added
                      
                    }, function (err, emailHTML) {
                        var mailOptions = {
                            to: 'rambabu.e@technoxis.in',
                            from: config.mailer.from,
                            subject: 'Password Reset',
                            html: emailHTML
                        };
                        smtpTransport.sendMail(mailOptions, function (err) {
                            if (!err) {
                                res.send({
                                    status: true,
                                    //resetPasswordToken: user.resetPasswordToken,
                                    message: 'An email has been sent to ' + user.email + ' with further instructions.'
                                });
                            }
            
                            // done(err);
                        });
                    });
                }
            });

       
    }
});
}

 
function addBusinessUnitUser(bUnit, user, units, done) {
    var found = false;
    var index = 0;
    if (user.company) {
        async.forEachSeries(bUnit.employees, function (employee, callback) {
            if (employee.user.toString() === user._id.toString()) {
                found = true;
            }
            index++;
            callback();
        }, function (err) {
            if (!err)
                done(null, bUnit, found);

        });
    } else {
        done(null, bUnit, found);

    }
}

/**
 * Save Business unit with current employee user
 * @param bunit
 * @param done
 */
function saveBusinessUnit(bunit, done) {
    bunit.save(function (bunitErr) {
        done(bunitErr, bunit);
    });
}

/**
 * Find the Employee at business unit level
 * @param user
 * @param units
 * @param done
 */
function findOrCreateBUser(user, units, userGroup, done) {
    var businessUnitNames = [];
    async.forEach(units, function (unit, callback) {
        BusinessUnit.findOne({
            _id: (unit.businessUnit ? unit.businessUnit : unit)
        }).exec(function (unitErr, resUnit) {
            if (unitErr) {
                logger.error('Fetching business unit error:' + unitErr);
                callback(unitErr);
            } else if (!resUnit) {
                logger.error('Business unit is not found with business unit id' + unit.businessUnit ? unit.businessUnit : unit);
                callback(new Error('Business unit is not found'));
            } else {
                businessUnitNames.push(resUnit.name);
                if (resUnit.employees && resUnit.employees.length > 0) {
                    var found = false;
                    addBusinessUnitUser(resUnit, user, units, function (err, bunit, found) {
                        if (!found) {
                            bunit.employees.push({
                                user: user._id,
                                userGroup: userGroup,
                                fromDate: Date.now()
                            });
                        }
                        bunit.save(function (bunitErr) {
                            if (bunitErr) {
                                callback(bunitErr);
                            } else {
                                callback();
                            }
                        });
                    });
                } else {
                    logger.error('Business unit do not have default employee' + resUnit);
                    callback(new Error('Business unit do not have default employee'));
                }
            }
        }, function (err) {
            callback(err);
        });
    }, function (err) {
        done(err, units, businessUnitNames);
    });
}

/**
 * Create user if there is no existing user.
 * Update user the company with specific role at different business unit level
 * update user the business unit with specific employee
 * @param userName
 * @param done
 */
function findOrCreateUser(userName, req, done) {

    var array = [];
    array.push({ username: userName });
    array.push({ email: userName });

    // we should skip the password as part of user fetch
    User.findOne({ $or: array }).select('username email mobile emailVerified mobileVerified otp emailOtp company status').exec(function (err, user) {
        if (err) {
            done(err, user, false);
        } else {
            var reqUser = new User(req.body);

            if (user instanceof User) {
                reqUser = _.extend(user, req.body);
                done(null, reqUser, false);
            } else {
                reqUser._id = mongoose.Types.ObjectId();
                reqUser.email = userName;
                reqUser.username = userName;
                var isNew = reqUser.isNew;
                crypto.randomBytes(20, function (err, buffer) {
                    if (reqUser.isNew) {
                        reqUser.statusToken = buffer.toString('hex');
                        reqUser.devices = [];
                        reqUser.devices = [];
                        reqUser.allowRegistration = true;
                        reqUser.serverUrl = req.protocol + '://' + req.headers.host;
                        reqUser.provider = 'local';
                        reqUser.status = 'Register Request';
                        reqUser.userType = 'Employee';
                        reqUser.updated = Date.now();
                        reqUser.save(function (err) {
                            done(err, reqUser, isNew);

                        });
                    }
                });
            }
        }


    });
}

function getBusinessUnitNames(units, done) {
    var businessUnitNames = [];
    async.forEachSeries(units, function (eachUnit, callback) {
        BusinessUnit.findById(eachUnit.businessUnit, function (buniterr, busunit) {
            if (buniterr) {
                done(buniterr, null);
            }
            else {
                businessUnitNames.push(busunit);
                callback();
            }
        });

    }, function (err) {
        done(err, businessUnitNames);
    });

}

function getBusinessUnits(units, company, done) {
    if (units && units.length > 0) {
        if (units instanceof Array && typeof (units[0]) === 'string') {
            done(null, units);
        } else {
            done(new Error('Should give business units id'), null);
        }
    } else {
        Company.findOne({
            _id: company
        }, function (errCompany, dbCompany) {
            if (errCompany) {
                done(errCompany, null);
            } else if (!dbCompany) {
                logger.error('Company not found' + company);
                done(new Error('Company not found'), null);
            } else {
                if (dbCompany && dbCompany.businessUnits.length > 0) {
                    var unitsObject = dbCompany.businessUnits.filter(function (eachUnit) {
                        return eachUnit.defaultBusinessUnit;
                    });
                    if (unitsObject.length === 0) {
                        done(new Error('Should give business units id'), null);
                    } else {
                        units = [unitsObject[0].businessUnit.toString()];
                        if (typeof (units[0]) === 'string') {
                            done(null, units);
                        } else {
                            logger.error('Should give business unit id as string');
                            done(new Error('Should give business unit id as string'), null);
                        }
                    }
                } else {
                    logger.error('The company with the name -' + company + ' is already registered. Please contact info@invipani.com');
                    done(new Error('The company with the name -' + company + ' is already registered. Please contact info@invipani.com'), null);
                }
            }
        });

    }
}

function sendEmailForEmployeeActivation(owner, userName, userGroupName, url, businessUnitNames, template, res, req, done) {
    logger.debug('Send activation url to email :' + userName);
    res.render(template, {
        owner: owner,
        userGroup: userGroupName,
        url: url,
        baseUrl: req.protocol + '://' + req.headers.host,
        businessUnits: businessUnitNames.join(' ,')
    }, function (err, emailHTML) {
        var smtpTransport = nodemailer.createTransport(config.mailer.options);
        var mailOptions = {
            to: userName,
            from: config.mailer.from,
            subject: 'Registration Request',
            html: emailHTML
        };
        if (config.production) {
            mailOptions.bcc = config.nvipaniAdminUsers;
        }
        smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                done(err);
            } else {

                done(null);
            }
        });
    });
}

function createCompanyBusinessUser(user, userName, company, units, userGroup, req, res, done) {
    getBusinessUnits(units, (company ? company : user.company), function (unitErr, selectedUnits) {
        if (unitErr) {
            done(unitErr, null);
        } else {
            findOrCreateUser(userName, req, function (err, currentuser, isNew) {
                if (err) {
                    done(err, null);
                } else if (!isNew) {
                    done(new Error('User is already used for some other company'), null);
                } else {
                    findOrCreateBUser(currentuser, selectedUnits, userGroup, function (bunitErr, units, businessUnitNames) {
                        if (bunitErr) {
                            logger.error('Error while add business user at business unit level');
                            done(bunitErr, null);
                        } else {
                            logger.debug('added business user  at businessunit level');
                            companyUtil.findOrCreateCUser(currentuser, company, units, userGroup, currentuser.statusToken, false, true, false, false, false, function (companyErr, updatedCompany, foundEmployee) {
                                if (companyErr) {
                                    done(companyErr, null);
                                } else if (!foundEmployee) {
                                    logger.error('User is not added at company level');
                                    done(new Error('User is not added at company level'), null);
                                } else {
                                    logger.debug('Sending Url -' + currentuser.username);
                                    var url = req.protocol + '://' + req.headers.host + '/auth/activeUser?token=' + currentuser.statusToken;
                                    companyUtil.findUserGroupById(userGroup, function (err, userGroupObject) {
                                        if (err) {
                                            done(err, null);
                                        } else {
                                            var template = 'templates/business-user-activation';
                                            sendEmailForEmployeeActivation(user.username, currentuser.username, userGroupObject.name, url, businessUnitNames, template, res, req, function (sendMailErr) {
                                                if (sendMailErr) {
                                                    done(sendMailErr, null);
                                                } else {
                                                    Company.populate(updatedCompany, { path: 'employees.user employees.userGroup' }, function (err, populateCompany) {
                                                        if (err) {
                                                            done(err, null);
                                                        } else {
                                                            done(null, populateCompany.employees, url);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });

                        }

                    });
                }
            });
        }
    });

}

exports.addBusinessUser = function (req, res) {
    var exp = new RegExp(config.emailRegEx);
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (!req.body.isResendLink) {
                var userName = req.body.username ? req.body.username : req.body.userName;
                if (!req.body.userGroup && !userName) {
                    return res.status(400).send({
                        status: false,
                        message: 'Should give required fields i.e user group and business user'
                    });
                } else if (!req.body.userGroup && userName) {
                    return res.status(400).send({
                        status: false,
                        message: 'Should give one user group for' + userName
                    });
                } else if (req.body.userGroup && !userName) {
                    return res.status(400).send({
                        status: false,
                        message: 'Should give user name'
                    });
                } else if (!exp.test(userName)) {
                    return res.status(400).send({
                        status: false,
                        message: 'Should give proper user name i.e email id'
                    });
                } else if (typeof (req.body.userGroup) !== 'string') {
                    return res.status(400).send({
                        status: false,
                        message: 'Should give userGroup id as string'
                    });
                } else {
                    var units = req.body.bunits;
                    var company = req.body.company;

                    if (company && typeof (company) !== 'string') {
                        return res.status(400).send({
                            status: false,
                            message: 'Should give Company id as string'
                        });
                    } else {
                        var userGroup = req.body.userGroup;
                        createCompanyBusinessUser(user, userName, (company ? company : user.company), units, userGroup, req, res, function (createErr, businessUser, url) {
                            if (createErr) {
                                return res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(createErr)
                                });
                            } else {
                                if (config.production) {
                                    res.send({ businessUser: businessUser });
                                } else {
                                    res.send({
                                        businessUser: businessUser,
                                        message: 'A link has been send to ' + businessUser[businessUser.length - 1].user.username + '. ' + url + ' is your activation link.'
                                    });
                                }
                            }
                        });
                    }

                }
            } else {
                var template = 'templates/business-user-activation';
                var url = req.protocol + '://' + req.headers.host + '/auth/activeUser?token=' + req.body.user.statusToken;
                sendEmailForEmployeeActivation(user.username, req.body.user.username, req.body.userGroup.name, url, req.body.businessUnitNames, template, res, req, function (sendMailErr) {
                    if (sendMailErr) {
                        return res.status(400).send({
                            status: false,
                            message: errorHandler.getErrorMessage(sendMailErr)
                        });
                    } else {
                        if (config.sendEmail) {
                            res.send({ message: 'Sent link to ' + req.body.user.username + ' for activation.' });
                        } else {
                            res.send({ message: 'Sent link to ' + req.body.user.username + ' for activation. Activation URL :' + url });
                        }
                    }
                });
            }
        }
    });
};

function updateUsersInCompany(user, employees, businessUnit, req, res, done) {
    Company.findOne({
        _id: user.company,
        'deleted': false
    }, 'employees businessUnits').populate('employees.user employees.userGroup').exec(function (errFetch, company) {
        if (errFetch) {
            done(new Error('Failed to load with company' + errorHandler.getErrorMessage(errFetch)), null);

        } else if (!company) {
            done(new Error('No company with company id :' + user.company), null);
        } else {
            async.forEachSeries(employees, function (eachEmployee, callback) {
                var companyEmployee = company.employees.filter(function (eachCompanyEmployee) {
                    return eachCompanyEmployee.user._id.toString() === eachEmployee.user.toString();
                });
                if (companyEmployee && companyEmployee.length === 1) {
                    company.employees[company.employees.indexOf(companyEmployee[0])]
                        .businessUnits.push({
                            businessUnit: businessUnit._id,
                            status: businessUnit.disabled ? 'Inactive' : 'Active'
                        });
                    logger.debug('Sending email notification while add business user to business unit');
                    var url = req.protocol + '://' + req.headers.host + '#!/signin';
                    var template = 'templates/business-user-add-notification';
                    var businessUnitNames = [];
                    businessUnitNames.push(businessUnit.name);
                    sendEmailForEmployeeActivation(user.username, companyEmployee[0].user.username, companyEmployee[0].userGroup.name, url, businessUnitNames, template, res, req, function (emailErr) {
                        if (emailErr) {
                            callback(emailErr);
                        } else {
                            callback();
                        }
                    });
                } else {
                    logger.error('Error while update business unit status in company employees' + company);
                    callback(new Error('Error while update business unit status in company employees'));
                }
            }, function (err) {
                if (err) {
                    logger.error('Error while update status in the company business units' + company);
                    done(err, null);
                } else {
                    company.save(function (companyUpdateErr) {
                        if (companyUpdateErr) {
                            done(companyUpdateErr, null);
                        } else {
                            done(null, company);
                        }
                    });
                }
            });
        }
    });
}

function updateUsersInBusinessUnit(unitId, employees, done) {
    if (!unitId) {
        done(new Error('Business unit id is required to add user to business unit'), null);
    } else if (unitId && typeof (unitId) !== 'string') {
        done(new Error('Business unit id is required as string to add user to business unit'), null);
    } else {
        BusinessUnit.findOne({
            _id: unitId.toString()
        }).exec(function (unitErr, businessUnit) {
            if (unitErr) {
                done(unitErr, null);
            } else if (!businessUnit) {
                done(new Error('Business unit is not found with id' + unitId), null);
            } else {
                if (!employees) {
                    done(new Error('Employees object is required to add'), null);
                } else if (employees && employees.length === 0) {
                    done(new Error('At least one employees object is required to add'), null);
                } else {
                    async.forEachSeries(employees, function (eachEmployee, callback) {
                        businessUnit.employees.push(eachEmployee);
                        callback();
                    }, function (err) {
                        if (err) {
                            done(new Error('Employee model is not correct'), null);
                        } else {
                            businessUnit.save(function (updateErr) {
                                if (updateErr) {
                                    done(updateErr, null);
                                } else {
                                    done(null, businessUnit);
                                }
                            });
                        }
                    });
                }
            }
        });
    }
}

exports.addMassEmployeesToBusinessUnit = function (req, res) {
    var token = req.body.token || req.headers.token;
    var unitId = req.body.unitId;
    var employees = req.body.employees;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            updateUsersInBusinessUnit(unitId, employees, function (unitUpdateErr, businessUnit) {
                if (unitUpdateErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(unitUpdateErr)
                    });
                } else {
                    updateUsersInCompany(user, employees, businessUnit, req, res, function (companyUpdateErr, company) {
                        if (companyUpdateErr) {
                            return res.status(400).send({
                                message: errorHandler.getErrorMessage(companyUpdateErr)
                            });
                        } else {
                            BusinessUnit.populate(businessUnit, { path: 'employees.user employees.userGroup' }, function (err, populateUnit) {
                                if (err) {
                                    return res.status(400).send({
                                        message: errorHandler.getErrorMessage(err)
                                    });
                                } else {
                                    return res.jsonp(populateUnit);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
};

function getCompanyEmployeeStatus(company, statusToken) {
    return company.employees.filter(function (eachCompanyEmployee) {
        return eachCompanyEmployee.statusToken && eachCompanyEmployee.statusToken.toString() === statusToken;
    });
}

exports.getRegisterRequestBusinessUser = function (req, res) {
    var statusToken = req.query.token;
    if (statusToken) {
        usersJWTUtil.findUserByStatusToken(statusToken, function (err, user) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else if (!user) {
                logger.error('User not found with status token' + statusToken);
                return res.status(400).send({
                    message: 'User is not found'
                });
            } else {
                if (user.userType === 'Employee') {
                    // checking user status at company employees
                    if (user.status === 'Register Request') {
                        var currentCompanyEmployee = getCompanyEmployeeStatus(user.company, statusToken);
                        if ((!currentCompanyEmployee) || (currentCompanyEmployee.length === 0)) {
                            logger.error('Failed to activate the user because No user at the company with status token' + statusToken);
                            return res.status(400).send({
                                message: 'User is not found in the company'
                            });
                        } else if (currentCompanyEmployee.length > 1) {
                            logger.error('More than one user is found in the company with status token' + statusToken);
                            return res.status(400).send({
                                message: 'More than one User is found in the company'
                            });
                        } else {
                            currentCompanyEmployee = currentCompanyEmployee[0];
                            if (!currentCompanyEmployee) {
                                logger.error('Failed to activate the user because No user at the company with status token' + statusToken);
                                return res.status(400).send({
                                    message: 'No user at the company'
                                });
                            } else if (currentCompanyEmployee.status === 'Request') {
                                logger.debug('Employee is Request state so take password from user to activate');
                                return res.redirect('/#!/company/userActivate/' + statusToken);
                            } else {
                                logger.error('Failed to activate because Employee is already used ');
                                return res.status(400).send({
                                    message: 'Employee is already used in company'
                                });
                            }
                        }
                    } else {
                        var companyUser = user.company.employees.filter(function (eachEmployee) {
                            return eachEmployee.user.toString() === user._id.toString();
                        });
                        if (companyUser && companyUser.length > 0) {
                            logger.error('Failed to activate user because User is already employee in the ' + user.company.name);
                            return res.status(400).send({
                                message: 'User is already employee in the ' + user.company.name
                            });
                        } else {
                            logger.error('Failed to activate user because User is already used for some other company ');
                            return res.status(400).send({
                                message: 'User is already used for some other company'
                            });
                        }
                    }

                } else {
                    logger.error('Failed to activate user because the user type is not employee ');
                    return res.status(400).send({
                        message: 'Should not able to activate as employee'
                    });
                }
            }
        });
    } else {
        logger.error('Failed to activate user because the user do not have status token');
        return res.status(400).send({
            message: 'should give status token for activate the user'
        });
    }
};

exports.getEmployeeDetailsForActivate = function (req, res) {
    var statusToken = req.params.statusToken;
    if (statusToken) {
        logger.debug('Getting employee details to display on the screen for activation' + statusToken);
        usersJWTUtil.findUserByStatusToken(statusToken, function (err, user) {
            if (err) {
                logger.error('Error while find user with status token' + statusToken + 'Error:' + err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else if (!user) {
                logger.error('User is not found while getting employee details' + statusToken);
                return res.status(400).send({
                    message: 'User is not found'
                });
            } else {
                logger.debug('Send employee details for display' + user);
                return res.send(user);
            }
        });
    } else {
        logger.error('Status token is required to get employee details');
        return res.status(400).send({
            message: 'Status token is required'
        });
    }
};

exports.activateBusinessUser = function (req, res) {
    var businessUser = req.body;
    var statusToken = req.params.statusToken ? req.params.statusToken : businessUser.statusToken;
    if (statusToken) {
        logger.debug('Request to get user with status token to activate' + statusToken);
        usersJWTUtil.findUserByStatusToken(statusToken, function (err, user) {
            if (err) {
                logger.error('Error while getting user for activation' + statusToken + 'Error:' + err);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else if (!user) {
                logger.error('User is not found to activate' + statusToken);
                return res.status(400).send({
                    message: 'User is not found'
                });
            } else {
                logger.debug('Get user object to activate');
                if (user.userType === 'Employee') {
                    user = _.extend(user, req.body);
                    user.status = 'Registered';
                    user.save(function (err) {
                        if (err) {
                            logger.error('Error while save user' + user + 'Error:' + err);
                            return res.status(400).send({
                                message: errorHandler.getErrorMessage(err)
                            });
                        } else {
                            logger.debug('User saved successfully' + user);
                            createCompanyContactWhileRegister(user, function (contactErr) {
                                if (contactErr) {
                                    logger.error('Error while creating nvipani company contact' + user);
                                    return res.status(400).send({
                                        status: false,
                                        message: errorHandler.getErrorMessage(contactErr)
                                    });
                                } else {
                                    logger.debug('nVipani conatact created successfully' + user);
                                    Company.findById(user.company, function (err, company) {
                                        if (err) {
                                            logger.error('Error while getting company at activation of user' + user);
                                            return res.status(400).send({
                                                message: err.message
                                            });
                                        } else if (!company) {
                                            logger.error('Company object is null at activation of user' + user);
                                            return res.status(400).send({
                                                message: 'Company is not found'
                                            });
                                        } else {
                                            logger.debug('Get company details of user' + company);
                                            var companyEmployee = getCompanyEmployeeStatus(company, user.statusToken);
                                            if ((!companyEmployee) || (companyEmployee.length === 0)) {
                                                logger.error('Employee is not found in the company' + company);
                                                return res.status(400).send({
                                                    message: 'Employee is not found in the company '
                                                });
                                            } else if (companyEmployee.length > 1) {
                                                logger.error('More than one Employee is found in the company' + company);
                                                return res.status(400).send({
                                                    message: 'More than one Employee is found in the company'
                                                });
                                            } else {
                                                company.employees[company.employees.indexOf(companyEmployee[0])].status = 'Active';
                                                company.save(function (err) {
                                                    if (err) {
                                                        logger.error('Error while save company at activate employee' + company);
                                                        return res.status(400).send({
                                                            message: errorHandler.getErrorMessage(err)
                                                        });
                                                    } else {
                                                        logger.debug('Company save at activate employee' + company);
                                                        res.jsonp(user);
                                                    }
                                                });
                                            }

                                        }
                                    });
                                }
                            });
                        }
                    });
                } else {
                    logger.error('Should not able to activate as employee' + user);
                    return res.status(400).send({
                        message: 'Should not able to activate as employee'
                    });
                }
            }
        });
    } else {
        logger.error('Status token is required to activate employee');
        return res.status(400).send({
            message: 'Status token is required'
        });
    }
};

function getCompanyEmployee(removeEmployee, companyEmployees, done) {
    done(companyEmployees.filter(function (eachEmployee) {
        return eachEmployee.user._id.toString() === removeEmployee.toString();
    }));
}
function findUserById(userId, done) {
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
function getCompanyEmployeeByUserId(eachCompanyEmployee, company, done) {
    findUserById(eachCompanyEmployee, function (userError, user) {
        if (userError) {
            logger.error('Employee is not found in users ' + eachCompanyEmployee);
            done(userError, null, null);
        } else {
            getCompanyEmployee(eachCompanyEmployee, company.employees, function (companyEmployee) {
                if ((!companyEmployee) || (companyEmployee.length === 0)) {
                    logger.error('Employee not found in the company with employee id' + eachCompanyEmployee);
                    done(new Error('Employee not found in the company'), null);
                } else if (companyEmployee.length > 1) {
                    logger.error('More than one Employee in the company with employee id' + eachCompanyEmployee);
                    done(new Error('More than one Employee in the company'));
                } else {
                    done(null, companyEmployee[0]);
                }

            });
        }
    });
}
function companyEmployeeActions(company, companyEmployee, isRemove, isEnable, isDisable, done) {
    if (isRemove) {
        if (companyEmployee.user.userType === 'Employee') {
            async.forEachSeries(companyEmployee.businessUnits, function (eachUnit, unitCallBack) {
                BusinessUnit.findOne({
                    _id: eachUnit.businessUnit.toString()
                }).exec(function (unitErr, businessUnit) {
                    if (unitErr) {
                        unitCallBack(unitErr);
                    } else {
                        if (businessUnit) {
                            var businessUnitEmployee = businessUnit.employees.filter(function (eachUnitEmployee) {
                                return eachUnitEmployee.user && eachUnitEmployee.user.toString() === companyEmployee.user._id.toString();
                            });
                            if ((!businessUnitEmployee) || (businessUnitEmployee.length === 0)) {
                                logger.error('Employee not found in the business unit with business unit' + businessUnit);
                                unitCallBack(new Error('Employee not found in the business unit'));
                            } else if (businessUnitEmployee.length > 1) {
                                logger.error('More than one employee in the business unit with business unit' + businessUnit);
                                unitCallBack(new Error('More than one employee in the business unit'));
                            } else {

                                businessUnit.employees.splice(businessUnit.employees.indexOf(businessUnitEmployee[0]), 1);
                                businessUnit.save(function (businessUnitUpdateErr) {
                                    if (businessUnitUpdateErr) {
                                        logger.error('Error while remove the employee from business units' + businessUnit);
                                        unitCallBack(businessUnitUpdateErr);
                                    } else {
                                        unitCallBack();
                                    }
                                });
                            }
                        } else {
                            logger.error('Business unit is not found with id' + eachUnit._id);
                            unitCallBack(new Error('Business unit is not found'));
                        }
                    }
                });
            }, function (businessUnitsErr) {
                if (businessUnitsErr) {
                    logger.error('Error while remove the employee' + businessUnitsErr);
                    done(businessUnitsErr);
                } else {
                    company.employees.splice(company.employees.indexOf(companyEmployee), 1);
                    company.save(function (companyUpdateErr) {
                        if (companyUpdateErr) {
                            logger.error('Error while remove the employee at company' + companyEmployee);
                            done(companyUpdateErr);
                        } else {
                            var deletedEmployee = company.employees.filter(function (eachEmployee) {
                                return eachEmployee._id.toString() === companyEmployee._id.toString();
                            });
                            if (deletedEmployee.length === 0) {
                                findUserById(companyEmployee.user._id.toString(), function (userError, user) {
                                    if (userError) {
                                        logger.error('Employee is not found in users ' + companyEmployee);
                                        done(new Error('Employee is not found in users'), null, null);
                                    } else {
                                        user.deleted = true;
                                        user.save(function (userUpdateErr) {
                                            if (userUpdateErr) {
                                                logger.error('Error while remove employee in users' + companyEmployee);
                                                done(userUpdateErr);
                                            } else {
                                                done();
                                            }
                                        });
                                    }
                                });
                            } else {
                                logger.error('Employee is not deleted at company level' + company);
                                done(new Error('Employee is not deleted at company level'));
                            }
                        }
                    });
                }
            });
        } else {
            logger.error('Default business user should not deleted ' + companyEmployee.user.username);
            done(new Error('Default business user should not deleted ' + companyEmployee.user.username));
        }
    }
    else if (isEnable || isDisable) {
        if (companyEmployee.user.status === 'Register Request') {
            logger.error(companyEmployee.user.username + ' user not registered');
            done(new Error(companyEmployee.user.username + ' user needs to be registered'));
        } else {
            company.employees[company.employees.indexOf(companyEmployee)].status = isEnable ? 'Active' : 'Inactive';
            company.save(function (companyUpdateErr) {
                if (companyUpdateErr) {
                    logger.error('Error while ' + (isEnable ? 'enable' : 'disable') + ' the employee at company' + companyEmployee);
                    done(companyUpdateErr);
                } else {
                    done();
                }
            });
        }
    } else {
        done(new Error('No Company user Operation'));
    }
}

exports.massActionsOnCompanyEmployees = function (req, res) {
    var data = req.body;
    var isRemove = req.body.isRemove;
    var isEnable = req.body.isEnable;
    var isDisable = req.body.isDisable;
    var token = req.body.token || req.headers.token;
    if (data.companyEmployees && data.companyEmployees.length > 0) {
        usersJWTUtil.findUserByToken(token, function (errFetch, getUser) {
            if (errFetch) {
                return res.status(400).send({
                    status: false,
                    message: 'Failed to load with user' + errorHandler.getErrorMessage(errFetch)
                });
            } else if (!getUser) {
                return res.status(400).send({
                    status: false,
                    message: 'No user with user id :' + token
                });
            } else {
                Company.findOne({
                    _id: getUser.company,
                    'deleted': false
                }, 'employees businessUnits').populate('employees.user employees.userGroup').exec(function (errFetch, company) {
                    if (errFetch) {
                        return res.status(400).send({
                            status: false,
                            message: 'Failed to load with company' + errorHandler.getErrorMessage(errFetch)
                        });
                    } else if (!company) {
                        return res.status(400).send({
                            status: false,
                            message: 'No company with company id :' + getUser.company
                        });
                    } else {
                        var results = { success: [], failure: [] };
                        async.forEachSeries(data.companyEmployees, function (eachCompanyEmployee, callback) {
                            if (typeof (eachCompanyEmployee) !== 'string') {
                                logger.error('Company employee id is required', eachCompanyEmployee);
                                results.failure.push({
                                    _id: eachCompanyEmployee,
                                    message: 'Company employee id is required'
                                });
                                callback(new Error('Company employee id is required'));
                            } else {
                                if (company.employees && (company.employees.length > 0)) {
                                    getCompanyEmployeeByUserId(eachCompanyEmployee, company, function (companyEmployeeErr, companyEmployee) {
                                        if (companyEmployeeErr) {
                                            results.failure.push({
                                                _id: companyEmployee,
                                                message: errorHandler.getErrorMessage(companyEmployeeErr)
                                            });
                                            callback(companyEmployeeErr);
                                        } else {
                                            companyEmployeeActions(company, companyEmployee, isRemove, isEnable, isDisable, function (err, user) {
                                                if (err) {
                                                    results.failure.push({
                                                        _id: companyEmployee._id,
                                                        message: errorHandler.getErrorMessage(err)
                                                    });
                                                    callback(err);
                                                } else {
                                                    results.success.push({
                                                        _id: companyEmployee._id,
                                                        companyEmployee: companyEmployee
                                                    });
                                                    callback();
                                                }
                                            });
                                        }

                                    });
                                } else {
                                    callback(new Error('No Company employees'));
                                }
                            }
                        }, function (err) {
                            if (err) {
                                return res.status(400).send(results);
                            } else {
                                if (isRemove) {
                                    logger.debug('successfully remove the employee at company');
                                    return res.jsonp(results);
                                } else if (isEnable) {
                                    logger.debug('successfully enable the employee at company');
                                    return res.jsonp(results);
                                } else if (isDisable) {
                                    logger.debug('successfully disable the employee at company');
                                    return res.jsonp(results);
                                }

                            }
                        });

                    }
                });
            }
        });
    } else {
        logger.error('Company employee ids are required for perform operations');
        return res.status(400).send({
            status: false,
            message: 'Company employees are not selected'
        });
    }
};

function businessUnitEmployeeActions(businessUnit, businessUnitEmployee, eachUnitEmployee, isRemove, done) {
    if (isRemove) {
        if (!businessUnitEmployee.incharge) {
            businessUnit.employees.splice(businessUnit.employees.indexOf(businessUnitEmployee), 1);
            businessUnit.save(function (businessUnitUpdateErr) {
                if (businessUnitUpdateErr) {
                    logger.error('Error while remove the employee from business units' + businessUnit);
                    done(businessUnitUpdateErr, null);
                } else {
                    //done(null, businessUnit);
                    Company.findOne({
                        _id: businessUnit.company.toString(),
                        'deleted': false
                    }).exec(function (companyErr, company) {
                        if (companyErr) {
                            logger.error('Error while fetching company using company id of business unit' + businessUnit.company);
                            done(companyErr, null);
                        } else {
                            var companyEmployee = company.employees.filter(function (eachCompanyEmployee) {
                                return eachCompanyEmployee.user && eachCompanyEmployee.user.toString() === eachUnitEmployee.toString();
                            });
                            if (!companyEmployee) {
                                logger.error('Employee is not found in company with company id ' + businessUnit.company);
                                done(new Error('Employee is not found in company'), null);
                            } else if (companyEmployee.length === 0) {
                                logger.error('Employee is not found in company with company id ' + businessUnit.company);
                                done(new Error('Employee is not found in company'), null);
                            } else if (companyEmployee.length > 1) {
                                logger.error('More than one Employee is found in company with company id ' + businessUnit.company);
                                done(new Error('More than one Employee is found in company'), null);
                            } else {
                                var companyEmployeeBunit = companyEmployee[0].businessUnits.filter(function (eachCompanyEmployeeUnit) {
                                    return eachCompanyEmployeeUnit.businessUnit && eachCompanyEmployeeUnit.businessUnit.toString() === businessUnit._id.toString();
                                });
                                var employeeIndex = company.employees.indexOf(companyEmployee[0]);
                                if (!companyEmployeeBunit) {
                                    logger.error('Business unit is not found in company with company id ' + businessUnit.company);
                                    done(new Error('Business unit is not found in company'), null);
                                } else if (companyEmployee.length === 0) {
                                    logger.error('Business unit is not found in company with company id  ' + businessUnit.company);
                                    done(new Error('Business unit is not found in company'), null);
                                } else if (companyEmployeeBunit.length > 1) {
                                    logger.error('More than one Business unit is found in company with same business unit with company id ' + businessUnit.company);
                                    done(new Error('More than one Business unit is  found in company'), null);
                                } else {
                                    var unitIndex = company.employees[employeeIndex].businessUnits.indexOf(companyEmployeeBunit[0]);
                                    company.employees[employeeIndex].businessUnits.splice(unitIndex, 1);
                                    company.save(function (companyUpdateErr) {
                                        if (companyUpdateErr) {
                                            logger.error('Error while remove the employee at company' + companyEmployee[0] + ' Error' + errorHandler.getErrorMessage(companyUpdateErr));
                                            done(companyUpdateErr, null);
                                        } else {
                                            done(null, businessUnit);
                                        }
                                    });
                                }
                            }
                        }
                    });
                }
            });
        } else {
            logger.error('Error while remove the employee from business units bez employee is incharge' + businessUnit);
            done(new Error('Incharge employee should not deleted'), null);
        }
        /*} else if (isEnable || isDisable) {
            if(businessUnitEmployee.user.status === 'Register Request'){
                logger.error(businessUnitEmployee.user.username +' user not registered');
                done(new Error(businessUnitEmployee.user.username +' user needs to be registered'));
            }else {
                businessUnit.employees[businessUnit.employees.indexOf(businessUnitEmployee)].status = isEnable ? 'Active' : 'Inactive';
                businessUnit.save(function (businessUnitUpdateErr) {
                    if (businessUnitUpdateErr) {
                        logger.error('Error while' + isEnable ? 'Active' : 'Inactive' + ' enable the employee at business unit level' + businessUnit);
                        done(businessUnitUpdateErr, null);
                    } else {
                        done(null, businessUnitEmployee);
                    }
                });
            }*/
    } else {
        done(new Error('No BusinessUnit user Operation'), null);
    }
}

exports.massActionsOnUnitEmployees = function (req, res) {
    var businessUnitId = req.body.businessUnit;
    var unitEmployees = req.body.businessUnitEmployees;
    var isRemove = req.body.isRemove;
    /*var isEnable = req.body.isEnable;
    var isDisable = req.body.isDisable;*/
    if (!businessUnitId) {
        logger.error('Business unit id is required');
        return res.status(400).send({
            status: false,
            message: 'Business unit id is require'
        });
    } else {
        if (!unitEmployees) {
            logger.error('business unit employees ids required to perform operations');
            return res.status(400).send({
                status: false,
                message: 'no selected business unit employees for perform operation'
            });
        } else if (unitEmployees.length === 0) {
            logger.error('At least one employee of business unit is required');
            return res.status(400).send({
                status: false,
                message: 'At least one employee of business unit is required'
            });
        } else {
            BusinessUnit.findOne({ _id: businessUnitId }, 'employees company').populate('employees.user').exec(function (unitErr, businessUnit) {
                if (unitErr) {
                    logger.error('no business unit with business unit id' + businessUnitId);
                    return res.status(400).send({
                        status: false,
                        message: errorHandler.getErrorMessage(unitErr)
                    });
                } else if (!businessUnit) {
                    logger.error('no business unit with business unit id' + businessUnitId);
                    return res.status(400).send({
                        status: false,
                        message: 'no business unit with business unit id'
                    });
                } else {
                    var results = { success: [], failure: [] };
                    async.forEachSeries(unitEmployees, function (eachUnitEmployee, callback) {
                        findUserById(eachUnitEmployee, function (userError, user) {
                            if (userError) {
                                logger.error('Employee is not found in users ' + eachUnitEmployee);
                                results.failure.push({
                                    _id: eachUnitEmployee,
                                    message: 'Employee is not found in users'
                                });
                                callback(new Error('Employee is not found in users'));
                            } else {
                                var businessUnitEmployee = businessUnit.employees.filter(function (eachBusinessUnitEmployee) {
                                    return eachBusinessUnitEmployee.user._id && eachBusinessUnitEmployee.user._id.toString() === eachUnitEmployee.toString();
                                });
                                if (!businessUnitEmployee) {
                                    logger.error('Employee is not found in business unit ' + businessUnit);
                                    results.failure.push({
                                        _id: eachUnitEmployee,
                                        message: 'Employee is not found in business unit'
                                    });
                                    callback(new Error('Employee is not found in business unit'));
                                } else if (businessUnitEmployee.length === 0) {
                                    logger.error('Employee is not found in business unit ' + businessUnit);
                                    results.failure.push({
                                        _id: eachUnitEmployee,
                                        message: 'Employee is not found in business unit'
                                    });
                                    callback(new Error('Employee is not found in business unit'));
                                } else if (businessUnitEmployee.length > 1) {
                                    logger.error('More than one Employee is found in business unit ' + businessUnit);
                                    results.failure.push({
                                        _id: eachUnitEmployee,
                                        message: 'More than one Employee is found in business unit'
                                    });
                                    callback(new Error('More than one Employee is found in business unit'));
                                } else {
                                    businessUnitEmployeeActions(businessUnit, businessUnitEmployee[0], eachUnitEmployee, isRemove, function (updateUnitErr, updateUnit) {
                                        if (updateUnitErr) {
                                            logger.error('Error while perform the businessUnit user operations ' + businessUnit + 'Error:' + updateUnitErr);
                                            results.failure.push({
                                                _id: eachUnitEmployee,
                                                message: errorHandler.getErrorMessage(updateUnitErr)
                                            });
                                            callback(updateUnitErr);
                                        } else {
                                            results.success.push({
                                                _id: eachUnitEmployee,
                                                unitEmployee: updateUnit
                                            });
                                            callback();
                                        }
                                    });
                                }
                            }
                        });
                    }, function (err) {
                        if (err) {
                            return res.status(400).send(results);
                        } else {
                            if (isRemove) {
                                logger.debug('successfully remove the employee at business unit level');
                                return res.status(200).send(results);
                            } /*else if (isEnable) {
                                logger.debug('successfully enable the employee at business unit level');
                                return res.status(200).send(results);
                            } else if (isDisable) {
                                logger.debug('successfully disable the employee at business unit level');
                                return res.status(200).send(results);
                            }*/

                        }
                    });
                }

            });

        }
    }
};

exports.updateBusinessUser = function (req, res, next) {
    var data = req.body;
    if (!data.user) {
        logger.error('Company employee id should required to update employee');
        return res.status(400).send({
            status: false,
            message: 'Company employee id should required to update employee'
        });
    } else if (typeof (data.user) !== 'string') {
        logger.error('Company employee id should required as string to update employee');
        return res.status(400).send({
            status: false,
            message: 'Company employee id should required as string to update employee'
        });
    } else if (!data.company) {
        logger.error('Company id should required to update employee');
        return res.status(400).send({
            status: false,
            message: 'Company id should required to update employee'
        });
    } else if (typeof (data.company) !== 'string') {
        logger.error('Company id should required as string to update employee');
        return res.status(400).send({
            status: false,
            message: 'Company id should required as string to update employee'
        });
    } else if (data.isGroup && !data.group) {
        logger.error('Employee group id should required to update employee');
        return res.status(400).send({
            status: false,
            message: 'Employee group id should required to update employee'
        });
    } else if (data.isGroup && data.group && typeof (data.group) !== 'string') {
        logger.error('Employee group id should required as string to update employee');
        return res.status(400).send({
            status: false,
            message: 'Employee group id should required as string to update employee'
        });
    } else {
        User.findOne({ _id: data.user, 'deleted': false }, '-salt -password', function (errFetch, getUser) {
            if (errFetch) {
                logger.error('Failed to load user for update employee' + data + 'Error' + errFetch);
                return res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(errFetch)
                });
            } else if (!getUser) {
                logger.error('User object getting null while update employee', data);
                return res.status(400).send({
                    status: false,
                    message: 'No user with user id :' + data.user
                });
            } else {
                logger.debug('Going to update employee at company', getUser);
                companyUtil.findOrCreateCUser(getUser, data.company, null, data.group, getUser.statusToken, data.isGroup, false, data.isActive, data.isDisabled, data.isRemove, function (err, companyUserUpdate, foundEmployee) {
                    if (err) {
                        logger.error('Error while update company employee', getUser);
                        return res.status(400).send({
                            status: false,
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        logger.debug('Successfully update user details' + getUser);
                        Company.populate(companyUserUpdate, { path: 'employees.user employees.userGroup' }, function (companyErr, company) {
                            if (companyErr) {
                                logger.error('Error while populate user and userGroups' + companyUserUpdate);
                                return res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(companyErr)
                                });
                            } else {
                                logger.debug('Send updated company with employees' + company);
                                return res.send(company);
                            }
                        });
                    }
                });
            }
        });
    }
};






