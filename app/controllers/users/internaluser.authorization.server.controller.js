'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    mongoose = require('mongoose'),
    errorHandler = require('../errors.server.controller'),
    usersJWTUtil = require('../utils/users.jwtutil'),
    logger = require('../../../lib/log').getLogger('USERS', 'DEBUG'),
    config = require('../../../config/config'),
    User = mongoose.model('InternalUser');
    

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id) {
    User.findOne({
        _id: id
    }).exec(function (err, user) {
        if (err) return next(err);
        if (!user) return next(new Error('Failed to load User ' + id));
        req.profile = user;
        next();
    });
};

/**
 * Require login routing middleware
 */
exports.requiresLogin = function (req, res, next) {
    logger.debug('requiresLogin - Request -' + JSON.stringify(req.body));
    logger.debug('requiresLogin - req.body.token -' + req.body.token);
    logger.debug('requiresLogin - req.headers[token] -' + req.headers.token);
    var token = req.body.token || req.headers.token;
    if (token  && token!=='null') {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (err) {
                return res.status(401).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                req.body.authenticated = true;
                /*res.status(200).send({
                 message: 'Successfully Logged Out'
                 });*/
                next();
            }
        });
    } else {
        req.body.authenticated = false;
        res.status(401).send({
            status: false,
            message: 'User is not logged in'
        });
    }
    // res.status(200).send({
    //             status: true,
    //             message: 'User is not logged in'
    //         });
    // console.log('finally testing working');
    

};

exports.requiresSpecificLogin = function (req, res, next) {
    logger.debug('requiresLogin - Request -' + JSON.stringify(req.body));
    logger.debug('requiresLogin - req.body.token -' + req.body.token);
    logger.debug('requiresLogin - req.headers[token] -' + req.headers.token);
    var token = req.body.token || req.headers.token;
    if (token  && token!=='null') {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (err) {
                return res.status(401).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                req.body.authenticated = true;
                if (user.username===config.adminuser) {
                    next();
                }
            }
        });
    } else {
        req.body.authenticated = false;
        res.status(401).send({
            status: false,
            message: 'User is not logged in'
        });
    }

};

/**
 * User authorizations routing middleware
 */
exports.hasAuthorization = function (roles) {
    var _this = this;

    return function (req, res, next) {
        _this.requiresLogin(req, res, function () {
            var token = req.body.token || req.headers.token;
            usersJWTUtil.findUserByToken(token, function (err, user) {
                if (user && _.intersection(user.roles, roles).length) {
                    return next();
                } else {
                    return res.status(403).send({
                        status: false,
                        message: 'User is not authorized'
                    });
                }
            });
        });
    };
};
