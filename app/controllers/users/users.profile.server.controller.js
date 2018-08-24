'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    errorHandler = require('../errors.server.controller.js'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    logger = require('../../../lib/log').getLogger('USERS', 'DEBUG'),
    passport = require('passport'),
    usersJWTUtil = require('../utils/users.jwtutil'),
    // businessUnitUtil =require('../utils/common.businessunit.util'),
    dbUtil = require('../utils/common.db.util'),
    // Notification = mongoose.model('Notification'),
    // UserGroup = mongoose.model('UserGroup'),
    // Company = mongoose.model('Company'),
    // Category = mongoose.model('Category'),
    // Order = mongoose.model('Order'),
    // Todo = mongoose.model('Todo'),
    // User = mongoose.model('User'),
    User = mongoose.model('Newuser'),

    async = require('async');
/**
 * Update user details
 */
exports.update = function (req, res) {
    // Init Variables

    var message = null;

    // For security measurement we remove the roles from the req.body object
    delete req.body.roles;
    delete req.body.password;
    delete req.body.salt;
    var token = req.body.token || req.headers.token;

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
                var versionKey = dbuser.userVersionKey;
                dbuser = _.extend(dbuser, req.body);
                dbuser.userVersionKey = versionKey;
                dbuser.updated = Date.now();
                console.log(dbuser);
                
                if (dbuser.firstName || dbuser.lastName || dbuser.middleName) {
                    dbuser.displayName = dbuser.firstName + (dbuser.middleName ? ' ' + dbuser.middleName : '') + (dbuser.lastName ? ' ' + dbuser.lastName : '');
                }

                dbuser.save(function (err) {
                    if (err) {
                        return res.status(400).send({
                            status: false,
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        res.json({
                            status: true,
                            token: usersJWTUtil.genToken(dbuser.username, dbuser.id),
                            user: dbuser
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
    });
};

/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
 
    
    var token = req.body.token || req.headers.token;
    if (token) {
        logger.debug('Profile Picture [name:' + req.files.file.name + ', fieldname:' + req.files.file.fieldname + ', originalname:' + req.files.file.originalname + ']');
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (user) {
                fs.writeFile('./public/modules/users/img/profile/uploads/' + req.files.file.name, req.files.file.buffer, function (uploadError) {
                    if (uploadError) {
                        return res.status(400).send({
                            status: false,
                            message: 'Error occurred while uploading profile picture'
                        });
                    } else {
                        User.findOne({
                            username: user.username
                        }, '-salt -password', function (err, dbuser) {
                            if (dbuser) {
                                dbuser.profileImageURL = 'modules/users/img/profile/uploads/' + req.files.file.name;

                                dbuser.save(function (saveError) {
                                    if (saveError) {    
                                        return res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(saveError)
                                        });
                                    } else {
                                        res.json({
                                            status: true,
                                            token: usersJWTUtil.genToken(dbuser.username, dbuser.id),
                                            user: dbuser
                                        });
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

/**
 * Send User
 */
exports.me = function (req, res) {
    /*logger.debug('req.token-'+req.token);
    logger.debug('req.body-'+JSON.stringify(req.body));
    logger.debug('req.body.token-'+req.body.token);*/
    // var token = req.body.token || req.headers.token;
    // if (token) {
    //     usersJWTUtil.findUserByToken(token, function (err, user) {
    //         if (err) {
    //             return res.status(400).send({
    //                 status: false,
    //                 message: errorHandler.getErrorMessage(err)
    //             });
    //         }
    //         res.json(user || null);


    //     });
    // } else {
    //     res.status(400).send({
    //         status: false,
    //         message: 'User is not signed in'
    //     });
    // }
    console.log('finally testing');

};

exports.register = function (req, res) {

    /*logger.debug('req.token-'+req.token);
    logger.debug('req.body-'+JSON.stringify(req.body));
    logger.debug('req.body.token-'+req.body.token);*/
    // var token = req.body.token || req.headers.token;
    // if (token) {
    //     usersJWTUtil.findUserByToken(token, function (err, user) {
    //         if (err) {
    //             return res.status(400).send({
    //                 status: false,
    //                 message: errorHandler.getErrorMessage(err)
    //             });
    //         }
    //         res.json(user || null);


    //     });
    // } else {
    res.status(400).send({
        status: false,
        message: 'User is not signed in',
        data: req.body
    });

    console.log('finally testing');

};

function removeDuplicates(businessUnitArray, done) {
    var unique_array = [];
    if (businessUnitArray && businessUnitArray.length > 0) {
        businessUnitArray.forEach(function (eachUnit) {
            if (unique_array.indexOf(eachUnit) === -1) {
                unique_array.push(eachUnit);
            }

        });

    }
    done(unique_array);


}
/**
 * Send User
 */
exports.myhome = function (req, res) {
    /*logger.debug('req.token-'+req.token);
     logger.debug('req.body-'+JSON.stringify(req.body));
     logger.debug('req.body.token-'+req.body.token);*/
    var token = req.body.token || req.headers.token;
    var version = req.query.version;
    var businessUnitId = req.query.businessUnitId;
    if (token) {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (err) {
                return res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });
            }

            // Notifications
            // Todo List
            // Order Summary
            // Sales Summary
            Company.findById(user.company).exec(function (err, company) {
                businessUnitUtil.findEmployeeBusinessUnits(user, function (errBunits, businessUnitArray) {
                    if (errBunits) {
                        logger.debug('Business Units');
                        return res.status(400).send({
                            status: false,
                            message: errorHandler.getErrorMessage(errBunits)
                        });
                    } else {
                        var query = {};
                        removeDuplicates(businessUnitArray, function (businessUnitsArray) {
                            logger.debug('Business Units length :' + JSON.stringify(businessUnitsArray));
                            query = (businessUnitsArray && businessUnitsArray.length > 0) ? { $or: businessUnitsArray } : {};
                            query.deleted = false;
                            query.disabled = false;
                            query.viewed = false;

                            Notification.find(query).populate('user', 'displayName').sort('-created').exec(function (err, notifications) {
                                if (err) {
                                    logger.debug('Notifications');
                                    return res.status(400).send({
                                        status: false,
                                        message: errorHandler.getErrorMessage(err)
                                    });
                                } else {
                                    logger.debug('Notifications Successful');
                                    dbUtil.findQueryByCategories([{ type: 'SubCategory1' }], 1, function (categories) {
                                        if (categories instanceof Error) {
                                            return res.status(400).send({
                                                status: false,
                                                message: errorHandler.getErrorMessage(categories)
                                            });
                                        } else {
                                            Todo.find({
                                                target: user._id,
                                                completed: false
                                            }).sort('-created').populate('user', 'displayName').exec(function (err, todos) {
                                                if (err) {
                                                    return res.status(400).send({
                                                        status: false,
                                                        message: errorHandler.getErrorMessage(err)
                                                    });
                                                } else {
                                                    res.jsonp({
                                                        status: true,
                                                        'notifications': notifications,
                                                        'offers': categories,
                                                        'todos': todos,
                                                        'companySegments': company.segments,
                                                        'isforceupdate': version ? false : true
                                                    });
                                                }
                                            });
                                            /*  }*/

                                        }
                                    });
                                }
                            });
                        });
                    }
                });
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
 * List of User Groups
 */
exports.listUserGroups = function (req, res) {
    var token = req.body.token || req.headers.token;
    if (token) {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            }
            UserGroup.find({ $and: [{ deleted: false }, { disabled: false }, { $or: [{ user: user.id }, { $and: [{ $or: [{ user: { $exists: false } }, { user: { $exists: true } }] }, { user: null }] }] }] }).exec(function (err, userGroups) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    res.jsonp(userGroups);
                }
            });
        });
    } else {
        return res.status(400).send({
            message: 'Not authorized user'
        });
    }
};

