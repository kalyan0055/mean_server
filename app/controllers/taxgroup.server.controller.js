'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    TaxGroup = mongoose.model('TaxGroup'),
    usersJWTUtil = require('./utils/users.jwtutil'),
    dbUtil = require('./utils/common.db.util'),
    logger = require('../../lib/log').getLogger('TAXGROUP', 'DEBUG'),
    //Category = mongoose.model('Category'),
    async = require('async'),
    _ = require('lodash');

/**
 * Create a Tax Group
 */
exports.create = function (req, res) {
    var taxGroup = new TaxGroup(req.body);
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        taxGroup.user = user;
        taxGroup.save(function (err) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    res.json(taxGroup,{status:true});
                }
            });


    });
};
function updateUser (user,docs,done) {

    async.each(docs, function (doc, docCallBack) {
        doc.user = user._id;

        var date = Date.now();
        doc.set('created', date);
        doc.set('lastUpdated', date);
        docCallBack();

    }, function (docErr) {
        if (!docErr) done(null,docs);
        else done(docErr);
    });

}

function getTaxGroups (category,docs) {
    if(!category.taxGroups || category.taxGroups===null){
        category.taxGroups=[];
    }
    async.each(docs, function (doc, docCallBack) {
        category.taxGroups.push((doc._id));
        docCallBack();

    });
    return category;

}
/*
 Create Mass Insert
 */
exports.createMassInsert = function (req, res) {
    var token = req.body.token || req.headers.token;
    var category=req.body.category;

    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        updateUser(user, req.body.doc, function (error, docs) {
            TaxGroup.collection.insert(docs, function (errDoc, listDocs) {
                if (errDoc) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(errDoc)
                    });
                } else {
                    dbUtil.findCategoryById(category._id,function (errFetch,populateCategory) {
                        if (errFetch) {
                            return res.status(400).send({
                                message: errorHandler.getErrorMessage(errFetch)
                            });
                        }else{
                                var category=getTaxGroups(populateCategory,listDocs);
                                category = _.extend(category, '');
                                category.save(function (err) {
                                    if (err) {
                                        return res.status(400).send({
                                            message: errorHandler.getErrorMessage(err)
                                        });
                                    } else {
                                        res.jsonp(category);
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
 * Show the current Tax Group
 */
exports.read = function (req, res) {
    res.jsonp(req.productBrand);
};
/**
 *
 */
/**
 *
 * @param req
 * @param res
 */

exports.taxGroupSearch = function (req, res) {
    var token = req.body.token || req.headers.token;
    var productKey = req.query.taxKey;
    var lastSyncTime = req.headers.lastsynctime;
    /*usersJWTUtil.getUserByToken(token, function (err, loginuser) {
        if(err){
            logger.error('Error while fetching products with subcategory2 :'+subCategory2Id+' using token number :'+token+' Details:'+errorHandler.getErrorMessage(err));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }else{*/


    var queryArray = [];
    var regExp={'$regex': productKey };
    for (var property in TaxGroup.schema.paths) {
        if (TaxGroup.schema.paths.hasOwnProperty(property)  && TaxGroup.schema.paths[property].instance === 'String') {
            var eachproduct={};
            eachproduct[property] = regExp;
            queryArray.push(eachproduct);
        }

    }

    var query={ $or : queryArray};

    TaxGroup.find(query).exec(function (taxError, taxs) {
        if (taxError) {
            logger.error('Error while fetching tax  with value: :'+productKey+' Details :'+errorHandler.getErrorMessage(taxError));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(taxError)
            });
        } else {
            logger.debug('Successfully  fetched tax with value :'+productKey);
            res.jsonp(taxs);
        }
    });
};

exports.hsnCodeSearch = function (req, res) {
    var token = req.body.token || req.headers.token;
    var productKey = req.query.hsnKey;
    var lastSyncTime = req.headers.lastsynctime;
    var hsncode = mongoose.model('Hsncodes');

    var queryArray = [];
    var regExp={'$regex': productKey };
    for (var property in hsncode.schema.paths) {
        if (hsncode.schema.paths.hasOwnProperty(property)  && hsncode.schema.paths[property].instance === 'String') {
            var eachproduct={};
            eachproduct[property] = regExp;
            queryArray.push(eachproduct);
        }

    }

    var query={ $or : queryArray};

    hsncode.find(query).exec(function (taxError, taxs) {
        if (taxError) {
            logger.error('Error while fetching tax  with value: :'+productKey+' Details :'+errorHandler.getErrorMessage(taxError));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(taxError)
            });
        } else {
            logger.debug('Successfully  fetched tax with value :'+productKey);
            res.jsonp(taxs);
        }
    });
};
/**
 * Update a Tax Group
 */
exports.update = function (req, res) {
    console.log('update funciton called');
   console.log(req.taxGroup);
   
    
    
    var taxGroup = req.taxGroup;
    var versionKey = taxGroup.taxGroupVersionKey;

    taxGroup = _.extend(taxGroup, req.body);
    taxGroup.taxGroupVersionKey = versionKey;
    taxGroup.set('lastUpdated', Date.now());

    taxGroup.save(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(taxGroup);
        }
    });
};

/**
 * Delete an Tax Group
 */
exports.delete = function (req, res) {
    console.log('delete groyp called');
    console.log(req.body._id);
    
    
    ///var taxGroup = req.taxGroup;

    // taxGroup.remove(function (err) {
    //     if (err) {
    //         return res.status(400).send({
    //             message: errorHandler.getErrorMessage(err)
    //         });
    //     } else {
    //         res.jsonp(taxGroup);
    //     }
    // });
     
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
       
        TaxGroup.deleteOne({_id:req.body._id},function (err) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    res.json({
                        message:'TaxGroup Successfully Deleted',
                        status:true
                    });
                }
            });


    });
    
};


/**
 * List of Tax Group Table
 */
exports.list = function (req, res) {
 //   TaxGroup.find().sort('-created').populate('user', 'displayName').populate('inventory').exec(function (err, categories) {

    TaxGroup.find().sort('-created').populate('newusers', 'displayName').exec(function (err, categories) {
        console.log(err,'eerrrr');
        
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {

            res.jsonp(categories);
        }
    });
};


/**
 * Tax Group By Id middleware
 */
exports.taxGroupById = function (req, res, next, id) {
    TaxGroup.findById(id).populate('user', 'displayName').exec(function (err, taxGroup) {
        if (err) return next(err);
        if (!taxGroup) return next(new Error('Failed to load Tax Group ' + id));
        req.taxGroup = taxGroup;
        next();
    });
};

/**
 * product Brand authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (req.taxGroup.user && req.taxGroup.user._id.toString() !== user._id) {
                return res.status(403).send('User is not authorized');
            } else {
                next();
            }
        }
    });

};
