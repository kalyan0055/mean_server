'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    errorHandler = require('../errors.server.controller.js'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    logger = require('../../../lib/log.js').getLogger('USERS', 'DEBUG'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    usersJWTUtil = require('../utils/users.jwtutil.js'),
    // businessUnitUtil =require('../utils/common.businessunit.util'),
    dbUtil = require('../utils/common.db.util.js'),
    User = mongoose.model('InternalUser'),
    newuserJWTUtil = require('../utils/users.jwtutil.js'),
    async = require('async'),
    config = require('../../../config/config.js'),

    nodemailer = require('nodemailer');

// Usevar ObjectId = require('mongoose').ObjectID;r = require('../models/user');
// bCrypt = require('bcrypt-nodejs');;
/**
 * Update user details
 */

exports.newuserslist = function (req, res) {

    var fields = req.body.columns[req.body.order[0].column].name;
    var sortBy = (req.body.order[0].dir == 'asc') ? 1 : -1;


    let obj = {};
    obj[`${fields}`] = sortBy

    newuserJWTUtil.findUserById(req.params.userid, function (err, result) {
        if (err || !result) {
            res.status(400).send({
                status: false,
                message: errorHandler.getErrorMessage(err),
                data: null
            })
        } else {
            let query = {};
            (result.userType === 'Admin') ? query = { 'username': { $ne: 'info@nvipani.com' } } : query = { 'created_by': req.params.userid, 'username': { $ne: 'info@nvipani.com' } }

            User.find(query).select('-salt -password').skip(req.body.start).limit(req.body.length).sort(obj).populate('created_by', 'username').exec(function (err, users) {
                if (err) {
                    res.status(400).send({
                        status: false,
                        message: errorHandler.getErrorMessage(err),
                        data: null
                    });
                }
                else if (!users) {
                    res.status(401).send({
                        status: false,
                        message: 'No Data Found',
                        data: null
                    })
                }
                else {
                    if (req.body.search.value != '' || req.body.search.value != null) {
                        var searchitem = '';
                        searchitem = req.body.search.value.toLowerCase()
                    }
                    let serchdata = [];
                    serchdata = users.filter(function (item) {
                        return JSON.stringify(item).toLowerCase().includes(searchitem);
                    });

                    User.find(query).count().populate('created_by', 'username').exec(function (err, tot_count) {
                        var count = tot_count;
                        res.status(200).send({
                            status: true,
                            message: 'List of Users by Id',
                            data: (!searchitem) ? users : serchdata,
                            tot_count: count
                        });;
                    })

                }
            });
        }
    })
};

function getEmailTemplate(user, type, req) {
    let a = null;
    a = new Buffer(user).toString('base64');  
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
                appName: 'Technical',
                otp: '125463',
                hyperlink: req.protocol + '://' + 'localhost:4200/confirm/true/' + a,
                baseUrl: req.protocol + '://' + req.headers.host,
                username: user
            }
        };
    } else {
        return { template: 'templates/user-registration', subject: 'Activated', options: {} };
    }
}
exports.registervialink = function (req, res, done) {


    var emailTemplate = getEmailTemplate(req.body.username, 'Register Request', req);


    res.render(emailTemplate.template, emailTemplate.options, function (err, emailHTML) {


        var smtpTransport = nodemailer.createTransport(config.mailer.options);
        var mailOptions = {
            to: 'rambabu.e@technoxis.in',
            from: config.mailer.from,
            subject: emailTemplate.subject,
            html: emailHTML
        };
        // if (config.production) {
        //     mailOptions.bcc = config.nvipaniAdminUsers;
        // }
        logger.debug('Sending OTP Response-');
        smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                /*res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });*/
                done(err, null);
            }
            if (!err) {
                res.json({
                    success: true,
                    data: req.body.username
                })
            }

        });
    })

}

exports.disableUser = function (req, res) {
    let data = req.body;
    newuserJWTUtil.findUserById(data.id, function (err, user) {
        if (err || !user) {
            logger.error('Something went wrong with -' + req.body.id + ', -' + JSON.stringify(data));
            logger.debug('Error Message-' + JSON.stringify(data));
            res.status(400).send({ status: false, message: errorHandler.getErrorMessage(err) });
        } else {
            let types = ['enable', 'disable'];
            if (!types.includes(data.type)) {
                return res.status(400).send({
                    status: false,
                    message: `Invalid type ${data.type} - it should be enable or disable`
                });
            }
            let type = '';
            (data.type === 'disable') ? type = true : type = false;

            User.updateOne({ _id: data.id }, { $set: { disabled: type } }, function (err, result) {
                if (err) {
                    return res.json({
                        status: false,
                        message: 'Unable to Disable User'
                    })
                } else {
                    return res.json({
                        status: true,
                        message: `User Successfully ${data.type}`
                    })
                }
            })
        }
    })
}

exports.deleteuser = function (req, res) {
    let data = null;
    data = req.params.userid;
    let token = req.body.token || req.headers.token;
    User.findOne({ '_id': (data) }, function (err, user) {
        if (err || !user) {
            logger.error('Something went wrong with -' + data + ', -' + JSON.stringify(err));
            logger.debug('Error Message-' + JSON.stringify(err));
            res.status(400).send({
                status: false,
                message: 'Error deleting the user with user id -' + data
            });
        } else {
            if (token) {
                hasAuthorization(token, function (err, validToken) {
                    if (err) {
                        return res.status(401).send({
                            success: false,
                            message: 'Your are not an Authorized User to delete this user',
                        })
                    } else {
                        if (user && validToken) {
                            User.updateOne({ _id: user._id }, { $set: { deleted: true } }, function (err, result) {
                                if (err || !result) {
                                    res.json({
                                        status: false,
                                        message: 'Unable to Restore'
                                    })
                                } else {
                                    res.json({
                                        status: true,
                                        message: 'User Successfully Deleted',
                                    })
                                }
                            })
                        } else {
                            return res.status(401).send({
                                success: false,
                                message: 'Session Expired or Invalid Token',
                            })
                        }
                    }
                })
            } else {
                return res.status(401).send({
                    success: false,
                    message: 'Session Expired or Invalid Token',
                })
            }

        }
    })

};

exports.restoreeuser = function (req, res) {
    let data = req.params.userid;
    newuserJWTUtil.findUserByIdOnly(data, function (err, user) {
        if (err || !user) {
            logger.error('Something went wrong with -' + data + ', -' + JSON.stringify(err));
            logger.debug('Error Message-' + JSON.stringify(err));
            res.status(400).send({
                status: false,
                message: 'Error deleting the user with user id -' + data
            });
        } else {
            if (user) {
                User.updateOne({ _id: user._id }, { $set: { deleted: false } }, function (err, result) {
                    if (err || !result) {
                        res.json({
                            status: false,
                            message: 'Unable to Delete'
                        })
                    } else {
                        res.json({
                            status: true,
                            message: 'User Successfully Restored',
                        })
                    }
                })
            }
        }
    })
};

function hasAuthorization(token, done) {
    var token = token;
    newuserJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            done(new Error('User is not authorized'), false, false);
        } else {
            if (user.userType == config.authType || user.userType == config.authType1) {
                done(null, user)
            } else {
                done(new Error('User is not authorized'), false, false);
            }

        }
    });

};
/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {

    var token = req.body.token || req.headers.token;
    if (token) {
        logger.debug('Profile Picture [name:' + req.files[0].filename + ', fieldname:' + req.files[0].fieldname + ', originalname:' + req.files[0].originalname + ']');
        newuserJWTUtil.findUserByToken(token, function (err, user) {
            if (user) {
                // fs.writeFile('./public/modules/users/img/profile/uploads/' + req.files[0].filename, req.body.buffer, function (uploadError) {
                //     if (uploadError) {
                //         return res.status(400).send({
                //             status: false,
                //             message: 'Error occurred while uploading profile picture'
                //         });
                //     } 


                var exist_image = './public/' + user.profileImageURL;
                var path = './public/modules/users/img/profile/uploads/' + req.files[0].filename;
                logger.debug('path:' + './public/modules/users/img/profile/uploads/' + req.files[0].filename);

                fs.rename(req.files[0].path, path, function (uploadError) {
                    if (uploadError || !req.files[0].mimetype) {
                        return res.status(400).send({
                            message: 'Error occurred while uploading file at ' + req.headers.uploadpath
                        });
                    }
                    else {
                        User.findOne({
                            username: user.username
                        }, '-salt -password', function (err, dbuser) {
                            if (dbuser) {
                                dbuser.profileImageURL = 'modules/users/img/profile/uploads/' + req.files[0].filename;

                                dbuser.save(function (saveError) {
                                    if (saveError) {
                                        return res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(saveError)
                                        });
                                    } else {
                                        fs.unlink(exist_image, function (err, result) {
                                            if (err) {
                                                return res.status(400).send({
                                                    status: false,
                                                    message: errorHandler.getErrorMessage(err)
                                                });
                                            } else {
                                                res.json({
                                                    status: true,
                                                    token: newuserJWTUtil.genToken(dbuser.username, dbuser.id),
                                                    user: dbuser,
                                                    path: req.files[0].filename
                                                });
                                            }
                                        })

                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.status(400).send({
                    status: false,
                    message: 'User is not signed in'
                });
            }
        });
    } else {
        res.status(400).send({
            status: false,
            message: 'User is not signed in'
        });
    }
};

exports.getUserById = function (req, res) {
    let data = null;
    data = req.params.userid;
    let token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByIdOnly(data, function (err, user) {
        if (err || !user) {
            logger.error('Something went wrong with -' + data + ', -' + JSON.stringify(err));
            logger.debug('Error Message-' + JSON.stringify(err));
            res.status(400).send({
                status: false,
                message: 'Error deleting the user with user id -' + data
            });
        }else {
            res.status(200).send({
                status: true,
                userData:user
            });
               
        }
    });
}


