'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    errorHandler = require('./errors.server.controller'),
    dbUtil = require('./utils/common.db.util'),
    Category = mongoose.model('Category'),
    Hsncodes = mongoose.model('Hsncodes'),
    usersJWTUtil = require('./utils/users.jwtutil'),
    newuserJWTUtil = require('./utils/newusers.jwtutil'),
    logger = require('../../lib/log').getLogger('CATEGORIES', 'DEBUG'),
    fieleupload = require('../controllers/utils/fileupload.util'),
    _ = require('lodash'),
    fs = require('fs');

/**
 * find a Categories with specific query fields
 */

/*function findQueryByCategories(query,populateLevels, done) {
    query.push({deleted:{$exists: false}});
   // query.push({deleted:{$exists: false}});
    if(populateLevels===0) {
        Category.find(query).exec(function (err, categories) {
            if (err) {
                done(err);
            } else {
                done(categories);

            }
        });
    }else if(populateLevels===1 || populateLevels===2){
        Category.find(query).sort('-created').populate('user', 'displayName').populate('children parent', 'name code type categoryImageURL1 description children parent').populate('hsncodes.hsncode', 'name code  description CGST SGST IGST').exec(function (err, categories) {
            if (err) {
               done(err);
            } else {
                if(populateLevels===1){
                    done(categories);
                }else {
                    Category.populate(categories, {
                        path: 'children.children children.parent parent.children parent.parent',
                        model: Category,
                        select: 'name code type categoryImageURL1 description children parent'
                    }, function (nestedErr, populatedResultCategories) {
                        if (nestedErr) {
                            done(nestedErr)
                        } else {
                            done(populatedResultCategories);
                        }
                    });
                }
            }
        });

    }
};
function findCategoryById(id,done){
    Category.findById(id).populate('user', 'displayName').populate('children parent', 'name code type categoryImageURL1 description children parent').populate('hsncodes.hsncode', 'name hsncode  description CGST SGST IGST').exec(function (err, populatedcategory) {
        if(err) done(err);
        done(populatedcategory);
    });
};*/

function getSingleFileObject(files, done) {
    if (files instanceof Array && files.length > 0) {
        done(files[0]);
    } else {
        done(null);
    }
}

function UpdateMainCategory(parentId, ChildId, done) {
    console.log(parentId, 'parent');
    console.log(ChildId, 'Child');
    Category.findOne({ "_id": parentId}, function (err, MainCategory) {
        console.log(MainCategory,'hellpo');
        if (err) {
            done(err, MainCategory)
        } else {
            Category.findOneAndUpdate({ "_id": parentId }, { $addToSet: { 'children': ChildId } },{ new: true }, function (err, UpdateMainCategory) {
                console.log(err, UpdateMainCategory,'haaikk');
         
                done(err, UpdateMainCategory)
            });
            
        }
    })
}
exports.create = function (req, res) {
    var category = new Category(req.body);
    // var category = {}
    // category = req.body;
    if(!req.files){
        createCategories(req,function(err,categories){
            if(err){
                return res.status(400).send({
                    message:errorHandler.getErrorMessage(err)
                })
            }else{
                res.jsonp(categories)
            }
        })
    }else{
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        category.user = user;
        var query = {};
        if (category.type !== 'SubCategory4') {
            if (category.type !== 'MainCategory')
                query = [{ name: 'Other', type: 'SubCategory1' }];
            if (category.type !== 'SubCategory1')
                query = [{ name: 'Other', type: 'SubCategory2' }];
            if (category.type !== 'SubCategory2')
                query = { name: 'Other', type: 'SubCategory3' };
            if (category.type !== 'SubCategory3')
                query = [{ name: 'Other', type: 'SubCategory4' }];
            console.log(query, 'queryyyyyyy');
            dbUtil.findQueryByCategories(query, 0, function (err, categories) {
                if (err) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                } else {
                    getSingleFileObject(req.files, function (file) {
                        var imageImportPath = {
                            maincategory: './public/modules/categories/img/profile/',
                            subcategory1: './public/modules/categories/img/subcategory1/',
                            subcategory2: './public/modules/categories/img/subcategory2/',
                        };
                        var imagePath = {
                            maincategory: 'modules/categories/img/profile/',
                            subcategory1: 'modules/categories/img/subcategory1/',
                            subcategory2: 'modules/categories/img/subcategory2/',
                        };
                        var path = imageImportPath[req.headers.uploadpath] + file.filename;
                        logger.debug('path:' + path + file.filename);
                        fs.rename(file.path, path, function (uploadError) {
                            if (uploadError || !file.mimetype) {
                                return res.status(400).send({
                                    message: 'Error occurred while uploading file at ' + req.headers.uploadpath
                                });
                            }
                            else {
                                category.children = categories;
                                category.categoryImageURL1 = imagePath[req.headers.uploadpath] + file.filename;
                                // Category.create(category,function(saveErr){
                                category.save(function (saveErr) {
                                    if (saveErr) {
                                        return res.status(400).send({
                                            message: errorHandler.getErrorMessage(saveErr)
                                        });
                                    } else {
                                        console.log(category._id, 'after insert');

                                        if (category.type === 'SubCategory1') {
                                            UpdateMainCategory(category.parent, category._id, function (err, MainCategory) {
                                                if (err || !MainCategory) {
                                                    return res.status(400).send({
                                                        message: errorHandler.getErrorMessage(err)
                                                    })
                                                } else {
                                                    dbUtil.findCategoryById(category._id, function (errFetch, populateCategory) {
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
                                        } else {
                                            dbUtil.findCategoryById(category._id, function (errCategory, populateCategory) {
                                                if (errCategory) {
                                                    return res.status(400).send({
                                                        message: errorHandler.getErrorMessage(errCategory)
                                                    });
                                                } else {
                                                    res.jsonp(populateCategory);
                                                }
                                            });
                                        }
                                    }
                                });
                            }
                        })
                    })
                }
            });
        } else {
            category.save(function (saveErr) {
                if (saveErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(saveErr)
                    });
                } else {
                    dbUtil.findCategoryById(category._id, function (errFetch, populateCategory) {
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
    }
};

function createCategories(req,done){
    var category = new Category(req.body);
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        category.user = user;
        var query = {};
        if (category.type !== 'SubCategory4') {
            if (category.type !== 'MainCategory')
                query = [{ name: 'Other', type: 'SubCategory1' }];
            if (category.type !== 'SubCategory1')
                query = [{ name: 'Other', type: 'SubCategory2' }];
            if (category.type !== 'SubCategory2')
                query = { name: 'Other', type: 'SubCategory3' };
            if (category.type !== 'SubCategory3')
                query = [{ name: 'Other', type: 'SubCategory4' }];
            console.log(query, 'queryyyyyyy');
            dbUtil.findQueryByCategories(query, 0, function (err, categories) {
                if (err) {
                    // return res.status(400).send({
                    //     message: errorHandler.getErrorMessage(err)
                    // });
                    done(err)
                } else {
                            category.children = categories;
                               // Category.create(category,function(saveErr){
                                category.save(function (saveErr) {
                                    if (saveErr) {
                                        // return res.status(400).send({
                                        //     message: errorHandler.getErrorMessage(saveErr)
                                        // });
                                        done(saveErr)
                                    } else {
                                        console.log(category._id, 'after insert');
                                        if (category.type === 'SubCategory1') {
                                            UpdateMainCategory(category.parent, category._id, function (err, MainCategory) {
                                                if (err || !MainCategory) {
                                                    // return res.status(400).send({
                                                    //     message: errorHandler.getErrorMessage(err)
                                                    // })
                                                    done(err);
                                                } else {
                                                    dbUtil.findCategoryById(category._id, function (errFetch, populateCategory) {
                                                        if (errFetch) {
                                                            // return res.status(400).send({
                                                            //     message: errorHandler.getErrorMessage(errFetch)
                                                            // });
                                                            done(errFetch);
                                                        } else {
                                                          //  res.jsonp(populateCategory);
                                                            done(err,populateCategory);
                                                        }
                                                    });
                                                }
                                            });
                                        } else {
                                            dbUtil.findCategoryById(category._id, function (errCategory, populateCategory) {
                                                if (errCategory) {
                                                    // return res.status(400).send({
                                                    //     message: errorHandler.getErrorMessage(errCategory)
                                                    // });
                                                    done(err)
                                                } else {
                                                    // res.jsonp(populateCategory);
                                                    done(err,populateCategory)
                                                }
                                            });
                                        }
                                    }
                                });
                }
            });
        } else {
            category.save(function (saveErr) {
                if (saveErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(saveErr)
                    });
                } else {
                    dbUtil.findCategoryById(category._id, function (errFetch, populateCategory) {
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
}

/**
 * create Hsncodes
 */
exports.createHsnCodes = function (req, res) {
    var hsncode = new Hsncodes(req.body);
    var subcategory = req.body.subcategory;
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
                    { _id: subcategory },
                    { $addToSet: { 'hsncodes': { hsncode: hsncode._id } } },
                    function (err, category) {
                        if (err) {
                            return res.status(400).send({
                                message: errorHandler.getErrorMessage(err)
                            });
                        } else if (!category || !category._id) {
                            return res.status(400).send({
                                message: 'No subcategory'
                            });
                        } else {
                            dbUtil.findCategoryById(category._id, function (errFetch, populateCategory) {
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
 * Show the current Category
 */
exports.read = function (req, res) {
    console.log(req.category, 'what is this.');
    res.jsonp(req.category);
};

/**
 * Update a Category
 */
exports.update = async function (req, res) {
    // filedata= await fieleupload.fileUploadPath(req,res);
    Category.findOne({ _id: req.body._id }, function (err, category) {
        if (err || !category) {
            return res.status(400).send({
                message: 'No Categories found'
            });
        }
        else {

            if(!req.files){
                           let update = {};
                            update = req.body;
                           // update.categoryImageURL1 = 'modules/categories/img/subcategory1/' + file.filename;
                           
                            //{_id:req.body._id},{$set:subset},
                            console.log(update, 'pefect');
                            Category.updateOne({ _id: req.body._id }, { $set: update }, function (saveErr, categry) {
                                if (saveErr) {
                                    return res.status(400).send({
                                        message: errorHandler.getErrorMessage(saveErr)
                                    });
                                } else {
                                    dbUtil.findCategoryById(category._id, function (errCategory, populateCategory) {
                                        if (errCategory) {
                                            return res.status(400).send({
                                                message: errorHandler.getErrorMessage(errCategory)
                                            });
                                        } else {
                                            res.jsonp(populateCategory);
                                        }
                                    });
                                }
                            });
            }else{
                var exist_image = './public/' + category.categoryImageURL1;
                getSingleFileObject(req.files, function (file) {
                    var path = './public/modules/categories/img/profile/' + file.filename;
                    logger.debug('path:' + './public/modules/categories/img/profile/' + file.filename);
                    fs.rename(file.path, path, function (uploadError) {
                        if (uploadError || !file.mimetype) {
                            return res.status(400).send({
                                message: 'Error occurred while uploading file at ' + req.headers.uploadpath
                            });
                        }
                        else {
                            let update = {};
                            update = req.body;
                            update.categoryImageURL1 = 'modules/categories/img/profile/' + file.filename;
                            console.log(update, 'pefect');
                            Category.updateOne({ _id: req.body._id }, { $set: update }, function (saveErr, categry) {
                                if (saveErr) {
                                    return res.status(400).send({
                                        message: errorHandler.getErrorMessage(saveErr)
                                    });
                                } else {
                                    dbUtil.findCategoryById(category._id, function (errCategory, populateCategory) {
                                        if (errCategory) {
                                            return res.status(400).send({
                                                message: errorHandler.getErrorMessage(errCategory)
                                            });
                                        } else {
                                            res.jsonp(populateCategory);
                                        }
                                    });
                                }
                            });
                        }
                    })
                })
            }
            
        }
    })
};

exports.disable = function (req, res) {

    var token = req.body.token || req.headers.token;
    let data = req.body;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err || !user) {

            logger.error('Something went wrong with -' + req.body.id + ', -' + JSON.stringify(err));
            logger.debug('Error Message-' + JSON.stringify(err));
            return res.status(400).send(err);
        } else {
            let type = null;
            (data.type === 'Disabled') ? type = true : type = false;
            Category.updateOne({ _id: data.id }, { $set: { disabled: type } }, function (err, result) {
                if (err) {
                    return res.json({
                        status: false,
                        message: `Unable to ${data.type} Main Category`
                    })
                } else {
                    return res.json({
                        status: true,
                        message: `Main Category Successfully ${data.type}`
                    })
                }
            })
        }
    })
};
// var subset = _.pick(req.body, ['name','code','type','_id']);

// category = _.extend

// console.log(exist_image,'existing image');


// category.save(function (err) {
//     if (err) {
//         return res.status(400).send({
//             message: errorHandler.getErrorMessage(err)
//         });
//     } else {
//             dbUtil.findCategoryById(category._id,function (errFetch,populateCategory) {
//                 if(errFetch)
//                     return res.status(400).send({
//                         message: errorHandler.getErrorMessage(errFetch)
//                     });
//                 else  res.jsonp(populateCategory);

//             });
//         }
// });


/**
 * Delete an Category
 */
exports.delete = function (req, res) {
    var category = req.category;

    category.remove(function (err) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(category);
        }
    });
};

/**
 * List of Categories
 */
exports.list = function (req, res) {
    dbUtil.findQueryByCategories([], 1, function (err, categories) {
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
 * List of MainCategories
 */
exports.listMainCategories = function (req, res) {
    dbUtil.findQueryByCategories([{ type: 'MainCategory' }], 1, function (err, categories) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(categories);
        }
    });
};
exports.listMainCategoriesWithSearch = function (req, res) {
    dbUtil.findQueryByCategories([{ type: 'MainCategory' }], 2, function (err, categories) {
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
 * List of SubCategories of type SubCategory1 with Search
 */
exports.listSubCategories1Search = function (req, res) {
    dbUtil.findQueryByCategories([{ type: 'SubCategory1' }], 1, function (err, categories) {
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
 * List of SubCategories of type SubCategory1
 */
exports.listSubCategories1 = function (req, res) {
    dbUtil.findQueryByCategories([{ type: 'SubCategory1' }], 1, function (err, categories) {
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
 * List of SubCategories of type SubCategory2
 */
exports.listSubCategories2 = function (req, res) {
    dbUtil.findQueryByCategories([{ type: 'SubCategory2' }], 1, function (err, categories) {
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
 * List of SubCategories of type SubCategory3
 */
exports.listSubCategories3 = function (req, res) {
    dbUtil.findQueryByCategories([{ type: 'SubCategory3' }], 1, function (err, categories) {
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
 * Category middleware
 */
exports.categoryByID = function (req, res, next, id) {
    dbUtil.findCategoryById(id, function (err, populateCategory) {
        if (err) return next(err);
        if (!populateCategory) return next(new Error('Failed to load Category ' + id));
        req.category = populateCategory;
        next();
    });
};

/**
 * Category authorization middleware
 */
exports.hasAuthorization = function (req, res, next) {
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            if (req.category.user && req.category.user.id.toString() !== user.id) {
                return res.status(403).send('User is not authorized');
            } else {
                next();
            }
        }
    });

};

exports.productCategorySearch = function (req, res) {
    var token = req.body.token || req.headers.token;
    var productKey = req.query.productKey;
    var lastSyncTime = req.headers.lastsynctime;
    var word = req.query.searchKey;

    var queryArray = [];
    var regExp = { '$regex': productKey };
    for (var property in Category.schema.paths) {
        if (Category.schema.paths.hasOwnProperty(property) && Category.schema.paths[property].instance === 'String') {
            var eachproduct = {};
            eachproduct[property] = regExp;
            queryArray.push(eachproduct);
        }

    }
    /*   var queryArrayHsnCode = [];
       for (var property in Hsncodes.schema.paths) {
           if (Hsncodes.schema.paths.hasOwnProperty(property)  && Hsncodes.schema.paths[property].instance === 'String') {
               var eachproduct={};
               eachproduct[property] = regExp;
               queryArrayHsnCode.push(eachproduct);
           }
   
       }
   
       var queryArrayBrand = [];
       for (var property in Hsncodes.schema.paths) {
           if (Hsncodes.schema.paths.hasOwnProperty(property)  && Hsncodes.schema.paths[property].instance === 'String') {
               var eachproduct={};
               eachproduct[property] = regExp;
               queryArrayBrand.push(eachproduct);
           }
   
       }*/


    /* queryArray.push({'hsnCodes.hsncode':{'$regex': productKey }});
     queryArray.push({'productBrands.name':{'$regex': productKey }});*/
    var query = [{ $or: queryArray }, { type: 'SubCategory2' }];
    /* dbUtil.findQueryByCategories([query],0,function (err ,products) {*/
    Category.find({ type: 'SubCategory2' }).populate([{
        path: 'hsnCodes',
        match: {
            hsncode: { '$regex': productKey }
        }
    }]).exec(function (err, categories) {
        if (err) {
            logger.error('Error while fetching products with value: :' + productKey + ' Details :' + errorHandler.getErrorMessage(err));
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            res.jsonp(categories);
            /*Category.populate(products, [{
                path: 'hsnCodes',
                model: Hsncodes/!*,
                match:{'hsncode':{'$regex': productKey }}*!/
            },{
                path: 'productBrands',
                    model: 'ProductBrand'/!*,
                    match:{'name':{'$regex': productKey }}*!/
            }]);*/
            categories.filter(function (doc) {
                return doc;
            });

        }
    });
};
exports.fetchProducts = function (req, res) {
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            dbUtil.findByCategorySelectionProduct(req.body.categories, req.body.businessUnit, user, function (categoryErr, matchedProducts) {
                if (categoryErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(categoryErr)
                    });
                } else {
                    res.jsonp(matchedProducts);
                }

            });
        }
    });
};
exports.fetchSubCategoryByName = function (req, res) {
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            var subCategories = [];
            dbUtil.findByCategoryAndSubCategoryName(req.body, subCategories, user, function (categoryErr, subcategory) {
                if (categoryErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(categoryErr)
                    });
                } else {
                    res.jsonp(subcategory);
                }

            });
        }
    });
};
exports.fetchProductImport = function (req, res) {
    var token = req.body.token || req.headers.token;
    usersJWTUtil.findUserByToken(token, function (err, user) {
        if (err) {
            return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
            });
        } else {
            var itemMasters = [];
            dbUtil.findByProductNames(req.body, itemMasters, user, function (categoryErr, subcategories) {
                if (categoryErr) {
                    return res.status(400).send({
                        message: errorHandler.getErrorMessage(categoryErr)
                    });
                } else {
                    res.jsonp(subcategories);
                }

            });
        }
    });
};
