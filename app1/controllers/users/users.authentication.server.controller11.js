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
    // User = mongoose.model('Newuser'),
    User = mongoose.model('User'),

    nodemailer = require('nodemailer'),
    async = require('async'),
    crypto = require('crypto'),
    config = require('../../../config/config'),
    dbUtil = require('../utils/common.db.util'),
    K = '12345678901234567890',
    globalUtil = require('../../controllers/utils/common.global.util');
 
exports.update = function (req, res) {
    var user = req.user;
    user = _.extend(user, req.body);
    user.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(user);
        }
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

                            //logger.debug('token-'+token);
                            if (resultUser.company.segments.length === 0) {
                                RegistrationCategory.findById(resultUser.company.registrationCategory).exec(function (registrationCErr, registrationCategory) {
                                    if (registrationCErr) {
                                        res.status(400).send({
                                            status: false,
                                            message: registrationCErr.getMessage()
                                        });
                                    } else {
                                        BusinessSegments.find().populate('categories.category').exec(function (businessErr, businessSegments) {
                                            companyUtil.findCompanyEmployeeBusinessUnits(user, function (userBusinessUnitsError, userBusinessUnits) {
                                                if (userBusinessUnitsError) {
                                                    res.status(400).send({
                                                        status: false,
                                                        message: errorHandler.getErrorMessage(userBusinessUnitsError)
                                                    });
                                                } else {
                                                    res.json({
                                                        status: true,
                                                        token: token,
                                                        businessUnits: userBusinessUnits,
                                                        companySegments: resultUser.company.segments,
                                                        categories: resultUser.company.categories,
                                                        segments: businessSegments,
                                                        registrationCategory: registrationCategory
                                                    });
                                                }
                                            });
                                        });
                                    }


                                });
                            } else {
                                companyUtil.findCompanyEmployeeBusinessUnits(user, logger, function (userBusinessUnitsError, userBusinessUnits) {
                                    if (userBusinessUnitsError) {
                                        res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(userBusinessUnitsError)
                                        });
                                    } else {
                                        res.json({
                                            status: true,
                                            token: token,
                                            businessUnits: userBusinessUnits,
                                            companySegments: resultUser.company.segments,
                                            categories: resultUser.company.category
                                        });
                                    }
                                });
                            }
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
    var reg = /^(?:\d{10,11}|([_a-zA-Z0-9]+(\.[_a-zA-Z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})))$/;
    console.log(data.issendemail, 'inputvlaidation');

    if (!data) {
        console.log(1, 'inputvlaidation');

        done(new Error('Username (Email/Mobile) field must not be blank'), null);
    } else if (data.issendotp && !data.issendemail) {
        console.log(2, 'inputvlaidation');
        if (!data.username) {
            logger.error('username is empty :' + JSON.stringify(data));
            done(new Error('Username (Email/Mobile) field must not be blank'), null);
        } else {
            if (!reg.test(data.username)) {
                logger.error('Username is not valid' + JSON.stringify(data));
                done(new Error('Username is not valid, Enter valid Email/Phone'), null);
            } else {
                logger.debug('Username is valid');
                if (!data.password) {
                    logger.error('Password is empty :' + JSON.stringify(data));
                    done(new Error('Password field must not be blank for the user :' + data.username), null);
                }
                else {
                    if (data.password.trim().length < 8) {
                        logger.error('Password is not valid +' + JSON.stringify(data));
                        done(new Error('Password is less than 8 chars'), null);
                    } else if (data.password.trim() !== data.conf_password.trim()) {
                        logger.error('Password and Confirm Password is not valid +' + JSON.stringify(data));
                        done(new Error('Password and Confirm Password must be equal'), null);
                    }
                    else {
                        logger.debug('Password is valid');
                        done(null, data);
                    }
                }
            }
        }
    } else if (data.isverifyotp) {
        console.log(3, 'inputvlaidation');
        if (!data.otp) {
            logger.error('OTP field is empty');
            done(new Error('OTP field is empty for user ' + data.username), null);
        } else if (data.password.trim().length < 8) {
            logger.error('Password is not valid +' + JSON.stringify(data));
            done(new Error('Password is less than 8 chars'), null);
        } else if (data.password.trim() !== data.conf_password.trim()) {
            logger.error('Password and Confirm Password is not valid +' + JSON.stringify(data));
            done(new Error('Password and Confirm Password must be equal'), null);
        }
        else {
            done(null, data);
        }
    } else if (data.ispassword) {
        console.log(4, 'inputvlaidation');
        if (!data.registrationCategory) {
            logger.error('No registration category found for the user :' + data.username);
            done(new Error('No registration category found for the user :' + data.username), null);
        }
        else {
            if (!data.selectedSegments || (data.selectedSegments && data.selectedSegments.length === 0)) {
                logger.error('No segments found for the Registration category :' + data.registrationCategory + 'for the user :' + data.username);
                // done(new Error('No segments found for the category :'+ data.registrationCategory + 'for the user :' +data.username),null);
                done(new Error('No segments found for the user :' + data.username), null);
            } else if (data.selectedSegments && data.selectedSegments.length > 0 && data.selectedSegments.filter(function (eachSegment) {
                return ((data.selectedSegments.length === 1 && eachSegment.isSpecific) || !eachSegment.isSpecific) && (!eachSegment.categories || (eachSegment.categories && eachSegment.categories.length === 0));
            }).length > 0) {
                logger.error('No Categories  found for the selected Segments for the user :' + data.username + ' with the registration Category :' + data.registrationCategory);
                // done(new Error('No segments found for the category :'+ data.registrationCategory + 'for the user :' +data.username),null);
                done(new Error('No Categories  found for the selected Segments for the user :' + data.username), null);
            }
            else {
                done(null, data);
            }
        }
    }
    else if (data.username && data.issendemail) {
        console.log(5, 'inputvlaidation', reg.test(data.username));
        if (!reg.test(data.username)) {
            logger.error('Username is not valid' + JSON.stringify(data));
            done(new Error('Username is not valid, Enter Valid Username'), null);
        } else {
            logger.debug('Username is valid');
            done(null, data);
        }
    }

    else {
        done(null, data);
    }
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
                    console.log(err,'eeeeerrrr');
                    
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
 
function userRegistrationProcess(user, data, done) {
    console.log(data);
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
                                salt = crypto.randomBytes(16).toString('base64');
                                console.log(salt,'Before saving salt value');
                                
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
                        userRegistrationProcess(user, data, function (userErr, user) {
                            if (userErr) {
                                return res.status(400).send({
                                    status: false,
                                    message: errorHandler.getErrorMessage(userErr)
                                });
                            } else {
                                if (user.status === 'Register Request') {
                                    if (data.issendotp) {
                                        sendRegistrationNotification(user, data, user.status, req, res, function (sendEmailErr, user) {
                                            console.log(sendEmailErr,'error');
                                            console.log(user,'after email');
                                            
                                            
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
                             
                                reqUser.allowRegistration = true;
                          
                                reqUser.status = 'Register Request';
                                reqUser.updated = Date.now();
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
                            console.log(data);
                            
                            logger.error('User is not registered properly' + data);
                            return res.status(400).send({
                                status: false,
                                message: 'User is not registered properly'
                            });
                        }
                    }
                }

            });
        }
    });

};



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
 

 





