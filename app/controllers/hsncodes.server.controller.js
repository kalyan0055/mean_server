'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    dbUtil = require('./utils/common.db.util'),
    Hsncodes=mongoose.model('Hsncodes'),
    usersJWTUtil = require('./utils/users.jwtutil'),
    logger  = require('../../lib/log').getLogger('CATEGORIES', 'DEBUG'),
    _ = require('lodash');
 
/**
 * create Hsncodes
 */
exports.createHsnCodes = function (req, res) {
    var hsncode = new Hsncodes(req.body);
    var subcategory= req.body.subcategory;
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        hsncode.user = user;
        hsncode.save(function (err) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {

                Category.findOneAndUpdate(
                    {_id: subcategory},
                    {$addToSet: {'hsncodes': {hsncode: hsncode._id}}},
                    function (err,category) {
                        if (err) {
                            return res.status(400).send({
                                message: errorHandler.getErrorMessage(err)
                            });
                        } else if(!category || !category._id){
                            return res.status(400).send({
                                message: 'No subcategory'
                            });
                        }else{
                            dbUtil.findCategoryById(category._id,function (errFetch,populateCategory) {
                                if (errFetch) {
                                    return res.status(400).send({
                                        message: errorHandler.getErrorMessage(errFetch)
                                    });
                                } else {
                                    res.jsonp(populateCategory);
                                }

                            });

                        }
                    });
            }
        });
    });
};
 

/**
 * List of Categories
 */
exports.list = function (req, res) {
    var token = req.body.token || req.headers.token;
    if (token) {
        usersJWTUtil.getUserByToken(token, function (err, loginuser) {
            if (loginuser) {
                var query;
                query = Hsncodes.find({$or: [{$and: [{deleted: false}]}  ]});
                query.sort('-created').populate('unitofmeasures', 'name').exec(function (err, hsncodes) {
                    if (err) {
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        res.jsonp(hsncodes);
                    }
                });
            }
        });
    } else {
        var query;
        query = Hsncodes.find({$and: [{deleted:{$exists: false}}, {user: null}]});
        query.sort('-created').exec(function (err, hsncodes) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.jsonp(hsncodes);
            }
        });
    }
};

 
 
