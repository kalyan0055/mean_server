'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    usersJWTUtil = require('./utils/users.jwtutil'),
    dbUtil = require('./utils/common.db.util'),
    logger = require('../../lib/log').getLogger('UNITOFMEASURE', 'DEBUG'),
    UnitOfMeasure = mongoose.model('UnitOfMeasure'),
  //  ProductBrand = mongoose.model('ProductBrand'),
    async = require('async'),
    fs = require('fs'),
    _ = require('lodash');

/**
 * Create a UnitOfMeasure
 */

exports.create = function (req, res) {
    var token = req.body.token || req.headers.token;
    var unitOfMeasure = new UnitOfMeasure(req.body);

    logger.debug('Creating UnitOfMeasure -' + JSON.stringify(unitOfMeasure));

    var date = Date.now();
    unitOfMeasure.set('created', date);
    unitOfMeasure.set('lastUpdated', date);

    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            //logger.debug('err 1 -'+err);
            //logger.debug('err 1 -'+JSON.stringify(err));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        unitOfMeasure.user = user;
        unitOfMeasure.lastUpdatedUser = user;

        unitOfMeasure.save(function (saveUnitOfMeasureErr) {
            if (saveUnitOfMeasureErr) {
                logger.error('Error while creating UnitOfMeasure.', saveUnitOfMeasureErr);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(saveUnitOfMeasureErr)
                });
            } else {
                res.jsonp(unitOfMeasure,status=true);
            }
        });
    });
};
function updateUser (user,docs,done) {

    async.each(docs, function (doc, docCallBack) {
        doc.user = user._id;

        var date = Date.now();
        doc.created= date;
        doc.lastUpdated= date;
        docCallBack();

    }, function (docErr) {
        if (!docErr) done(null,docs);
        else done(docErr);
    });

}
function getUOMs (category,docs) {
    if(!category.unitOfMeasures || category.unitOfMeasures===null){
        category.unitOfMeasures=[];
    }
    async.each(docs, function (doc, docCallBack) {
        category.unitOfMeasures.push((doc._id));
        docCallBack();

    });
    return category;

}
/*
 Create Mass Insert
 */
exports.createMassInsert = function (req, res) {
    var token = req.body.token || req.headers.token;
    var category = req.body.category;
    var brand = req.body.brand;

    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        updateUser(user, req.body.doc, function (error, docs) {
            UnitOfMeasure.collection.insert(docs, function (errDoc, listDocs) {
                if (errDoc) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(errDoc)
                    });
                } else {
                    if(category)
                        dbUtil.findCategoryById(category._id,function (errFetch,populateCategory) {
                            if (errFetch) {
                                return res.status(400).send({
                                    message: errorHandler.getErrorMessage(errFetch)
                                });
                            }else {
                                var category=getUOMs(populateCategory,listDocs);
                                category = _.extend(category, '');
                                category.save(function (saveErr) {
                                    if (saveErr) {
                                        return res.status(400).send({
                                            message: errorHandler.getErrorMessage(saveErr)
                                        });
                                    } else {
                                        res.jsonp(category);
                                    }
                                });
                            }
                        });
                    else
                        ProductBrand.findById(brand,function (errPopulateBrand, populateBrand) {
                            if(errPopulateBrand){
                                return res.status(400).send({
                                    message: errorHandler.getErrorMessage(errPopulateBrand)
                                });
                            }else {
                                var brand=getUOMs(populateBrand,listDocs);
                                brand = _.extend(brand, '');
                                brand.save(function (saveBrandErr) {
                                    if (saveBrandErr) {
                                        return res.status(400).send({
                                            message: errorHandler.getErrorMessage(saveBrandErr)
                                        });
                                    } else {
                                        res.jsonp(brand);
                                    }
                                });
                            }
                        });
                   /* });*/
                }
            });
        });
    });
};
/**
 * Show the current UnitOfMeasure
 */
exports.read = function (req, res) {
    res.jsonp(req.unitOfMeasure);
};

/**
 * Update a UnitOfMeasure
 */
exports.update = function (req, res) {
    var unitOfMeasure = req.unitOfMeasure;
    var token = req.body.token || req.headers.token;

    var versionKey = unitOfMeasure.unitOfMeasureVersionKey;

    unitOfMeasure = _.extend(unitOfMeasure, req.body);

    unitOfMeasure.unitOfMeasureVersionKey = versionKey;

    unitOfMeasure.set('lastUpdated', Date.now());

    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            //logger.debug('err 1 -'+err);
            //logger.debug('err 1 -'+JSON.stringify(err));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        unitOfMeasure.lastUpdatedUser = user;

        unitOfMeasure.save(function (saveUnitOfMeasureErr) {
            if (saveUnitOfMeasureErr) {
                logger.error('Error while creating Contact.', saveUnitOfMeasureErr);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(saveUnitOfMeasureErr)
                });
            } else {
                res.jsonp(unitOfMeasure);
            }
        });
    });
};


/**
 * Delete an UnitOfMeasure
 */

exports.delete = function (req, res) {
    var unitOfMeasure = req.unitOfMeasure;

    var token = req.body.token || req.headers.token;

    var versionKey = unitOfMeasure.unitOfMeasureVersionKey;

    unitOfMeasure = _.extend(unitOfMeasure, req.body);

    unitOfMeasure.unitOfMeasureVersionKey = versionKey;

    unitOfMeasure.deleted = true;
    unitOfMeasure.set('lastUpdated', Date.now());

    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            //logger.debug('err 1 -'+err);
            //logger.debug('err 1 -'+JSON.stringify(err));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        unitOfMeasure.lastUpdatedUser = user;

        unitOfMeasure.save(function (saveUnitOfMeasureErr) {
            if (saveUnitOfMeasureErr) {
                logger.error('Error while creating Contact.', saveUnitOfMeasureErr);
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(saveUnitOfMeasureErr)
                });
            } else {
                res.jsonp(unitOfMeasure);
            }
        });
    });
};
/**
 *
 * @param req
 * @param res
 */

exports.UOMSearch = function (req, res) {
    var token = req.body.token || req.headers.token;
    var productKey = req.query.uomKey;
    var isSimple = req.query.isSimple;
    var lastSyncTime = req.headers.lastsynctime;
    /*usersJWTUtil.getUserByToken(token, function (err, loginuser) {
        if(err){
            logger.error('Error while fetching products with subcategory2 :'+subCategory2Id+' using token number :'+token+' Details:'+errorHandler.getErrorMessage(err));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }else{*/


    var queryArray = [];
    if(productKey) {
        var regExp = {'$regex': productKey};
        for (var property in UnitOfMeasure.schema.paths) {
            if (UnitOfMeasure.schema.paths.hasOwnProperty(property) && UnitOfMeasure.schema.paths[property].instance === 'String') {
                var eachproduct = {};
                eachproduct[property] = regExp;
                queryArray.push(eachproduct);
            }

        }
    }

    var query={};
    if(queryArray.length>0){
        query={$and:[{type:isSimple?'Simple':'Compound'},{ $or : queryArray}]};
    }else{
        query={$and:[{type:isSimple?'Simple':'Compound'}]};
    }

    UnitOfMeasure.find(query).exec(function (uomError, uoms) {
        if (uomError) {
            logger.error('Error while fetching uoms with value: :'+productKey+' Details :'+errorHandler.getErrorMessage(uomError));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(uomError)
            });
        } else {
            logger.debug('Successfully  fetched uoms with value :'+productKey );
            res.jsonp(uoms);
        }
    });
    /*    }*/
    /* });*/
};
/**
 * List of UnitOfMeasures
 */
exports.list = function (req, res) {
    var token = req.body.token || req.headers.token;
    if (token) {
        usersJWTUtil.getUserByToken(token, function (err, loginuser) {
            if (loginuser) {
                var query;
                query = UnitOfMeasure.find({$or: [{$and: [{deleted: false}, {user: loginuser.id}]}, {$and: [{deleted: false}, {user: null}]}]});
                query.sort('-created').populate('user', 'displayName').exec(function (err, unitOfMeasures) {
                    if (err) {
                        return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        res.jsonp(unitOfMeasures);
                    }
                });
            }
        });
    } else {
        var query;
        query = UnitOfMeasure.find({$and: [{deleted:{$exists: false}}, {user: null}]});
        query.sort('-created').exec(function (err, unitOfMeasures) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {
                res.jsonp(unitOfMeasures);
            }
        });
    }

};

/**
 * Contact middleware
 */
exports.unitOfMeasureByID = function (req, res, next, id) {
    UnitOfMeasure.findById(id).populate('user', 'displayName').exec(function (err, unitOfMeasure) {
        if (err) return next(err);
        if (!unitOfMeasure) return next(new Error('Failed to load UnitOfMeasure ' + id));
        req.unitOfMeasure = unitOfMeasure;
        next();
    });
};

/**
 * UnitOfMeasure authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    var token = req.body.token || req.headers.token;
    usersJWTUtil.getUserByToken(token, function (err, user) {
        if (err) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            }
        } else {
            if ((req.unitOfMeasure.user !== null) && (req.unitOfMeasure.user.id.toString() !== user.id)) {
                return res.status(403).send('User is not authorized');
            } else {
                next();
            }
        }
    });
};

