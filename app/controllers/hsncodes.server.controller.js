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
    _ = require('lodash'),
    async = require('async');
 
/**
 * create Hsncodes
 */
exports.createHsnCodes = function (req, res) {
    console.log(req.body);
    
    var hsncode = new Hsncodes(req.body);
    var subcategory= req.body.subcategory;
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        hsncode.save(function (err,hsnCodes) {
            if (err) {
                return res.status(400).send({
                    message: errorHandler.getErrorMessage(err)
                });
            } else {

                return res.json({hsncodes:hsnCodes,messagge:'HSN Code added successfully',status:true})
                // Category.findOneAndUpdate(
                //     {_id: subcategory},
                //     {$addToSet: {'hsncodes': {hsncode: hsncode._id}}},
                //     function (err,category) {
                //         if (err) {
                //             return res.status(400).send({
                //                 message: errorHandler.getErrorMessage(err)
                //             });
                //         } else if(!category || !category._id){
                //             return res.status(400).send({
                //                 message: 'No subcategory'
                //             });
                //         }else{
                //             dbUtil.findCategoryById(category._id,function (errFetch,populateCategory) {
                //                 if (errFetch) {
                //                     return res.status(400).send({
                //                         message: errorHandler.getErrorMessage(errFetch)
                //                     });
                //                 } else {
                //                     res.jsonp(populateCategory);
                //                 }

                //             });

                //         }
                //     });
            }
        });
    });
};
 
exports.updateHsnCode = function (req,res){
    console.log('coming here');
    
    var hsncodes = new Hsncodes(req.body);
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token,function(err,usrs){
        if(err){
            return res.status(400).send({
                message:errorHandler.getErrorMessage(err)
            })
        }else{
            Hsncodes.findOneAndUpdate({_id:hsncodes._id},{$set:hsncodes},{new:true},function(err,hsn){
               console.log(hsn,'tttt');
               
                if(err){
                    return res.status(400).send({
                        message:errorHandler.getErrorMessage(err)
                    })
                }else if(!hsn){
                       return res.status(400).send({
                        message:errorHandler.getErrorMessage(hsn)
                    })
                }else{
                    res.json({
                        status:true,
                        message:'HSN Code successfully updated'
                    })
                }
            })
        }
    })
}

exports.deletehsn = function(req,res){
    var hsncodes = new Hsncodes(req.body);
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token,function(err,usrs){
        if(err){
            return res.status(400).send({
                message:errorHandler.getErrorMessage(err)
            })
        }else{
            Hsncodes.deleteOne({_id:hsncodes._id},function(err,hsn){
               console.log(hsn,'tttt');
               
                if(err){
                    return res.status(400).send({
                        message:errorHandler.getErrorMessage(err)
                    })
                }else if(!hsn){
                       return res.status(400).send({
                        message:errorHandler.getErrorMessage(hsn)
                    })
                }else{
                    res.json({
                        status:true,
                        message:'HSN Code Deleted Successfully'
                    })
                }
            })
        }
    })
}
/**
 * List of Categories
 */
 exports.list =   function  (req, res) {

       var pageSize = +req.query.pageSize;
    var page = +req.query.page;
    var token = req.body.token || req.headers.token;
    if (token) {
         usersJWTUtil.getUserByToken(token, function (err, loginuser) {  
            if (loginuser) { 
                var query;
                query = Hsncodes.find({$or: [{$and: [{deleted: false}]}  ]}).skip(pageSize * (page - 1) ).limit(pageSize).populate('unitofmeasures', 'uqcCode').sort('-_id').exec( async function (err, hsncodes) {
                    if (err) {
                         return res.status(400).send({
                            message: errorHandler.getErrorMessage(err)
                        });
                    } else {
                        let total ;
                        const number = await Hsncodes.count();
                        res.json({hsncodes:hsncodes,count:number});
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

 
 
