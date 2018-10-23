'use strict';
var mongoose = require('mongoose'),
    async = require('async'),
    errorHandler = require('../errors.server.controller'),
    logger  = require('../../../lib/log').getLogger('CATEGORIES', 'DEBUG'),
    importLogger = require('../../../lib/log').getLogger('IMPORTFILE', 'DEBUG'),
    // ItemMaster=mongoose.model('ItemMaster'),
    // Inventory = mongoose.model('Inventory'),
    // ProductBrand = mongoose.model('ProductBrand'),
    // StockMaster = mongoose.model('StockMaster'),
    // Company = mongoose.model('Company'),
    // TaxGroup = mongoose.model('TaxGroup'),
    // HsnCode=mongoose.model('Hsncodes'),
    // Contact = mongoose.model('Contact'),
    User = mongoose.model('InternalUser'),
    // UnitOfMeasure = mongoose.model('UnitOfMeasure'),
     Category = mongoose.model('Category'),
    _this = this;
/*
 Add global Code for Categories
 */

/**
 * find a Categories with specific query fields
 */
exports.findQueryByCategories =function(cQuery,populateLevels, done) {
    var query;
    if(cQuery && cQuery.length>0){
        query={$and:cQuery};
    }
    //query.push({deleted:{$exists: false}});
    if(populateLevels===0) {
        Category.find(query).exec(function (err, categories) {
            if (err) {
                done(err,null);
            } else {
                done(null,categories);

            }
        });
    }else if(populateLevels===1 || populateLevels===2){
        Category.find(query).sort('-created').populate('user', 'displayName').populate('children parent', 'name code type categoryImageURL1 description children parent productCategory').exec(function (firstErr, categories) {
            if (firstErr) {
                done(firstErr);
            } else {
                if(populateLevels===1){
                    done(null,categories);
                }else {
                    Category.populate(categories, {
                        path: 'children.children children.parent parent.children parent.parent',
                        model: Category,
                        select: 'name code type categoryImageURL1 description children parent grandParent'
                    }, function (nestedErr, populatedResultCategories) {
                        done(nestedErr,populatedResultCategories);

                    });
                }
            }
        });

    }
};
/**
 * find a Category with id with populate fields
 */
exports.findCategoryById =   function(id,done){
     Category.findById(id).populate('user', 'displayName').populate('children parent grandParent', 'name code type categoryImageURL1 description children parent grandParent').populate('hsnCodes unitOfMeasures productBrands taxGroups').exec(function (err, populatedcategory) {
        done(err,populatedcategory);
    });
};
exports.findBusinessUnit=function(companyId,done){
    Company.findById(companyId,function(err,compRes){
        if(err){
            done(new Error('Could not a find default business unit'));
        }
        else if(compRes===null){
            done(new Error('Could not a find default business unit'));
        }
        else{
            var defaultBu = compRes.businessUnits.filter(function(bu){
                return bu.defaultBusinessUnit===true;
            });
            if(defaultBu && defaultBu.length===1){
                done(null,defaultBu[0]);
            }
            else{
                done(new Error('Could not a find default business unit'),null);
            }
        }
    });
};
exports.findDefaultBusinessUnit = function(user,done){
    var company = user.company;
    if(!company){
        User.findById(user.id,function(userErr,loggedinUser){
            _this.findBusinessUnit(loggedinUser.company,function(err,bunit){
                if(err){
                    done(err,null);
                }
                else{
                    done(null,bunit);
                }
            });
        });
    }
    else{
        _this.findBusinessUnit(company,function(err,bunit){
            if(err){
                done(err,null);
            }
            else{
                done(null,bunit);
            }
        });
    }

};


// We need to figure it out what are all pending user item masters in current business unit.
// Currently it is fetching by user id
function getOnlyPendingItemMaster(brands,businessUnit,user,done) {
    var currentBrands=[];
    async.forEachSeries(brands, function (brand, brandBack) {
        var validUOMs=[];
        async.forEachSeries(brand.unitOfMeasures, function (uom, uomBack) {
            Inventory.findOne({
                'productBrand': brand._id,
                'unitOfMeasure': uom,
                'businessUnit':businessUnit,
                'deleted':false
            }, function (userItemMasterErr, userItemMaster) {
                if(userItemMaster){
                    uomBack();
                }else{
                    validUOMs.push(uom);
                    uomBack();
                }

            });
        }, function (errUOM) {
            if (errUOM) {
                //logger.error(errorHandler.getErrorMessage(err));
                brandBack(errUOM);
            } else {
                brand.unitOfMeasures=validUOMs;
                currentBrands.push(brand);
                brandBack();
            }
        });
    }, function (err) {
        if (err) {
            //logger.error(errorHandler.getErrorMessage(err));
            done(err);
        } else {
            done(null, currentBrands);
        }
    });
}
function populateOnlyChildren(categories,childNode,businessUnit,user,done) {
    async.forEachSeries(categories, function (eachCategory, callback) {
        Category.findById(eachCategory.category?eachCategory.category:eachCategory.toString()).exec(function (errChild, populatedcategory) {
            if(errChild){
                done(errChild);
            }else{
                if((!populatedcategory.children || populatedcategory.children.length===0) && populatedcategory.productBrands.length!==0){
                    Category.populate(populatedcategory,'hsnCodes unitOfMeasures productBrands taxGroups parent grandParent',function (errChild,productNode) {
                        getOnlyPendingItemMaster(productNode.productBrands,businessUnit,user,function (errBrand,productBrands) {
                            productNode.productBrands=productBrands;
                            Category.populate(productNode, [{
                                path: 'productBrands.unitOfMeasures',
                                model: 'UnitOfMeasure'},{path: 'productBrands.taxGroup',
                                model: 'TaxGroup'},{ path: 'productBrands.hsncode',
                                model: 'Hsncodes'}] ,function (errChild,productBrandNode) {
                                childNode.push(productBrandNode);
                                callback();
                            });
                        });
                    });
                }else{
                    populateOnlyChildren(populatedcategory.children,childNode,businessUnit,user, function (errChild,respChildNode) {
                        callback();
                    });
                }
            }
        });
    }, function (err) {
        if (err) {
            //logger.error(errorHandler.getErrorMessage(err));
            done(err);
        } else {
            done(null, childNode);
        }
    });


}
exports.findByCategorySelectionProduct = function(categories,businessUnit,user,done){
    var childNode=[];
    populateOnlyChildren(categories,childNode,businessUnit,user,function (err,childNodes) {
        done(err,childNodes);
    });

};
function findCategory(query,fields,done) {
    Category.findOne(query,fields).exec(function(errCategory, category) {
        if(errCategory){
            done(errCategory,null);
        }else if(!category){
            done(new Error('No Category'),null);
        }else{
            done(null,category);
        }

    });
}

exports.findByCategoryAndSubCategoryName = function(categories,macthedCategories,user,done){
    async.forEachSeries(categories, function (eachCategory, callback) {
        var error=null;
        findCategory({
            'name': eachCategory.mainCategoryName,
            type: 'MainCategory'
        },null,function(errParent,mainCategory) {
            if (errParent) {
                error= 'Failed to get the main category with name :'+eachCategory.mainCategoryName +' :' +errorHandler.getErrorMessage(errParent);
                logger.error(error);
                macthedCategories.push({name:eachCategory.subCategoryName,type:'SubCategory1',parent:{name:eachCategory.mainCategoryName, type: 'MainCategory'},error:error});
                callback();
            }else if(!mainCategory){
                error = 'Failed to get the main category with name :'+eachCategory.mainCategoryName;
                logger.error(error);
                macthedCategories.push({name:eachCategory.subCategoryName,type:'SubCategory1',parent:{name:eachCategory.mainCategoryName, type: 'MainCategory'},error:error});
                callback();
            }else {
                findCategory({'name': eachCategory.subCategoryName,type: 'SubCategory1',parent: mainCategory._id}, 'name type parent',function (errChild, subCategory1) {
                    if(errChild){
                        error = 'Failed to get the subcategory with name :'+eachCategory.subCategoryName +' :' +errorHandler.getErrorMessage(errChild);
                        logger.error(error);

                        macthedCategories.push({name:eachCategory.subCategoryName,type:'SubCategory1',parent:{_id:mainCategory._id,name:mainCategory.mainCategoryName, type: mainCategory.type},error:error});

                        callback();
                    }else if(!subCategory1) {
                        error = 'Failed to get the subcategory with name :' + eachCategory.subCategoryName;
                        logger.error(error);
                        macthedCategories.push({name:eachCategory.subCategoryName,type:'SubCategory1',parent:{_id:mainCategory._id,name:mainCategory.mainCategoryName, type: mainCategory.type},error:error});
                        callback();
                    }else{
                        macthedCategories.push({name:subCategory1.name,type:subCategory1.type,_id:subCategory1._id,parent:{_id:mainCategory._id,name:mainCategory.name,type:mainCategory.type}});
                        callback();
                    }
                });
            }
        });
    }, function (err) {
        if (err) {
            //logger.error(errorHandler.getErrorMessage(err));
            logger.error(errorHandler.getErrorMessage(err));
            done(err,null);
        } else {
            done(null, macthedCategories);
        }
    });
};
function containerData(index,header,eachHeader) {
    if(index>0){
        return index;
    }else{
        return header.indexOf(eachHeader);
    }

}
function getContainers(eachLineData,header,containerNames,warnings,done) {
    if(containerNames && containerNames.length>0){
        var containers=[];
        var curCount;
        async.forEach(containerNames,function(eachContainer,callback) {
            var l = containerNames.indexOf(eachContainer);
            var smfields = containerNames[l].split('.');

            var count = parseInt(smfields[1]) - 1;
            if (curCount === -1 || curCount !== count) {
                curCount = count;
                containers[curCount] = {};
            }
            var eachHeaderIndex=containerData(header.indexOf(containers[l]),header,eachContainer);
            switch (smfields[2]) {
                case 'Name': {
                    var name=eachLineData.lineData[eachHeaderIndex];
                    if(name && name.length>0) {
                        containers[curCount].name = eachLineData.lineData[eachHeaderIndex];
                    }
                    callback();
                    break;
                }
                case 'Units': {
                    var units=eachLineData.lineData[eachHeaderIndex];
                    if(units && units.length>0)
                        containers[curCount].numberOfUnits = eachLineData.lineData[eachHeaderIndex];
                    callback();

                    break;
                }
                case 'UnitOfMeasure': {
                    var uom =eachLineData.lineData[eachHeaderIndex];
                    if(uom) {
                        containers[curCount].unitOfMeasureName = eachLineData.lineData[eachHeaderIndex];
                        findUnitOfMeasureByName(eachContainer, header, eachLineData, false, function (unitOfMeasureErr, unitOfMeasure) {
                            if (unitOfMeasureErr) {
                                callback(unitOfMeasureErr);

                            } else {
                                containers[curCount].unitOfMeasure = unitOfMeasure._id;
                                callback();
                            }

                        });
                    }else {
                        callback();
                    }
                    break;
                }
            }

        },function(err){
            done(err,containers);
        });

    }else{
        done(null,null);
    }
}

function getMargins(eachLineData,header,marginHeaderNames,warnings,type){
    var margins = [];
    var eachHeaderNames=marginHeaderNames.filter(function (eachMatchHeaderName) {
        return (eachMatchHeaderName && eachMatchHeaderName !== '' && eachMatchHeaderName.endsWith('.'+type));
    });
    eachHeaderNames.forEach(function(eachMarginHeaderName) {
        var eachMarginHeaderNames = marginHeaderNames.filter(function (eachMatchHeaderName) {
            return (eachMatchHeaderName && eachMatchHeaderName !== '' && eachMatchHeaderName.startsWith(eachMarginHeaderName.substring(0, eachMarginHeaderName.indexOf('.'+type))));
        });
        if (eachMarginHeaderNames.length===2) {
            if (eachMarginHeaderNames[0].endsWith('.'+type) && eachMarginHeaderNames[1].endsWith('.Margin')) {
                var moq=0, margin=0;
                //logger.debug("Value:"+eachLineData.lineData[header.indexOf(eachMoqVsMarginHeaderNames[0])]);
                var moqValue = eachLineData.lineData[header.indexOf(eachMarginHeaderNames[0])];
                if(moqValue && moqValue.match('^\\d+$')){
                    moq = Number(moqValue);
                }
                else{
                    if(moqValue!=='') {
                        importLogger.warn('Invalid '+type+' value');
                        warnings.push({message: 'Invalid '+type+' value', srcLine: eachLineData.srcLine});
                    }
                    //done(new Error('Invalid moq value found at line:'+eachLineData.srcLine));
                }
                var marginValue = eachLineData.lineData[header.indexOf(eachMarginHeaderNames[1])];
                if(marginValue.endsWith('%')){
                    marginValue = marginValue.substring(0, marginValue.length - 1);
                }
                if(marginValue && marginValue.match('^\\d+(\.\\d+)?$')) {
                    margin = Number(marginValue).valueOf();
                }
                else{
                    if(marginValue!=='') {
                        importLogger.error('Invalid margin value.');
                        warnings.push({message: 'Invalid margin value', srcLine: eachLineData.srcLine});
                    }

                }
                if (moq && margin) {
                    if(type==='MOQ') {
                        margins.push({'MOQ': moq, 'margin': margin});
                    }
                    else{
                        margins.push({'MOV': moq, 'margin': margin});
                    }
                }
            }
        }
    });

    return margins;


}
function findProductBrand(productBrand,done) {
    ProductBrand.findById(productBrand._id).populate('user', 'displayName').populate('productCategory hsncode taxGroup').exec(function (productBrandErr, finalProductBrand) {
        if (productBrandErr) {
            done(productBrandErr, null);
        } else {
            ProductBrand.populate(finalProductBrand, [/*{ path: 'unitOfMeasure.firstUnitOfMeasure unitOfMeasure.secondUnitOfMeasure',
                model: 'UnitOfMeasure'},*/{
                path: 'productCategory.parent',
                model: 'Category'
            }, {
                path: 'productCategory.grandParent',
                model: 'Category'
            }], function (errorPopulateUOM, singleProductUOMBrand) {
                if (errorPopulateUOM) {
                    done(errorPopulateUOM, null);
                } else {
                    productBrand.brand = singleProductUOMBrand;
                    done(errorPopulateUOM, singleProductUOMBrand);
                }


            });
        }
    });
}
/**
 *
 * @param productBrand
 * @param unitOfMeasure
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */
function createItemMaster(productBrand, unitOfMeasure, header, eachLineData, user, warnings,businessUnit,done) {
    // Create Product Brand

    var mrp = Number(eachLineData.lineData[header.indexOf('MRP')]).valueOf();
    var barCode = eachLineData.lineData[header.indexOf('Barcode')];
    var sku = eachLineData.lineData[header.indexOf('SKU')];
    var dealerPrice =  Number(eachLineData.lineData[header.indexOf('DealerPrice')]).valueOf();
    var qrcode = eachLineData.lineData[header.indexOf('QRCode')];
//LeastSalableQuantity	MRP	DealerPrice	IsBillable	IsInventoryItem	IsRegularItem	IsConsignmentItem	IsStockCheckRequired	ReOrderLevel
// LastPurchasePrice	CurrentCost	MoqAndMargin.1.MOQ	MoqAndMargin.1.Margin	MoqAndMargin.2.MOQ	MoqAndMargin.2.Margin	MovAndMargin.1.MOV
// MovAndMargin.1.Margin	MovAndMargin.2.MOV	MovAndMargin.2.Margin	SKU	Barcode	QRCode
    var lsq =  Number(eachLineData.lineData[header.indexOf('LeastSalableQuantity')]).valueOf();
    var isBillable = false;
    if (eachLineData.lineData[header.indexOf('IsBillable')]) {
        isBillable = ('TRUE'.toUpperCase() === eachLineData.lineData[header.indexOf('IsBillable')].toUpperCase());
    }
    var isInventoryItem = false;
    if (eachLineData.lineData[header.indexOf('IsInventoryItem')]) {
        isInventoryItem = ('TRUE'.toUpperCase() === eachLineData.lineData[header.indexOf('IsInventoryItem')].toUpperCase());
    }

    var isRegularItem = false;
    if (eachLineData.lineData[header.indexOf('IsRegularItem')]) {
        isRegularItem = ('TRUE'.toUpperCase() === eachLineData.lineData[header.indexOf('IsRegularItem')].toUpperCase());
    }

    var isConsigmentItem = false;
    if (eachLineData.lineData[header.indexOf('IsConsignmentItem')]) {
        isConsigmentItem = ('TRUE'.toUpperCase() === eachLineData.lineData[header.indexOf('IsConsignmentItem')].toUpperCase());
    }

    var isStockCheckRequired = false;
    if (eachLineData.lineData[header.indexOf('IsStockCheckRequired')]) {
        isStockCheckRequired = ('TRUE'.toUpperCase() === eachLineData.lineData[header.indexOf('IsStockCheckRequired')].toUpperCase());
    }

    var reorderLevel = Number(eachLineData.lineData[header.indexOf('ReOrderLevel')]).valueOf();
    var lastPurchasePrice = Number(eachLineData.lineData[header.indexOf('LastPurchasePrice')]).valueOf();
    var currentCost = Number(eachLineData.lineData[header.indexOf('CurrentCost')]).valueOf();

    //MoqAndMargin.1.MOQ	MoqAndMargin.1.Margin	MoqAndMargin.2.MOQ	MoqAndMargin.2.Margin	MovAndMargin.1.MOV
    // MovAndMargin.1.Margin	MovAndMargin.2.MOV	MovAndMargin.2.Margin

    var moqVsMarginHeaderNames = header.filter(function (moqVsMarginHeaderName) {
        return (moqVsMarginHeaderName && moqVsMarginHeaderName !== '' && moqVsMarginHeaderName.startsWith('MoqAndMargin') && (moqVsMarginHeaderName.endsWith('.MOQ')||moqVsMarginHeaderName.endsWith('.Margin')));
    });
    logger.debug('moqvsmarginheadernames:'+JSON.stringify(moqVsMarginHeaderNames));
    var movVsMarginHeaderNames = header.filter(function (movVsMarginHeaderName) {
        return (movVsMarginHeaderName && movVsMarginHeaderName !== '' && movVsMarginHeaderName.startsWith('MovAndMargin') && (movVsMarginHeaderName.endsWith('.MOV')||movVsMarginHeaderName.endsWith('.Margin')));
    });
    var containerHeaderNames = header.filter(function (containerHeaderName) {
        return (containerHeaderName && containerHeaderName !== '' && containerHeaderName.startsWith('Container') && (containerHeaderName.endsWith('.Name')||containerHeaderName.endsWith('.Units') || containerHeaderName.endsWith('.UnitOfMeasure')));
    });
    logger.debug('containerHeaderNames:'+JSON.stringify(containerHeaderNames));
    var itemMaster = new ItemMaster({
        MRP: mrp,
        barcode: barCode,
        SKU: sku,
        qrcode: qrcode,
        leastSalableQuantity: lsq,
        isBillable: isBillable,
        isInventoryItem: isInventoryItem,
        isRegularItem: isRegularItem,
        isStockCheckRequired: isStockCheckRequired,
        isConsigmentItem: isConsigmentItem,
        reorderLevel: reorderLevel,
        lastPurchasePrice: lastPurchasePrice,
        currentCost: currentCost,
        dealerPrice: dealerPrice
    });
    itemMaster.productBrand = productBrand._id;
    itemMaster.unitOfMeasure = unitOfMeasure._id;
    findProductBrand(productBrand,function (brandError,finalProductBrand) {
        if(brandError){
            done(brandError,null);
        }else {
            itemMaster.brandName = finalProductBrand.name;
            itemMaster.brandVariety = finalProductBrand.variety;
            itemMaster.brandOwner = finalProductBrand.brandOwner;
            itemMaster.manufacturers = finalProductBrand.manufacturers;
            itemMaster.hsncode = finalProductBrand.hsncode._id;
            itemMaster.hsncodeName = finalProductBrand.hsncode.hsncode;
            itemMaster.taxGroup = finalProductBrand.taxGroup._id;
            itemMaster.taxGroupName = finalProductBrand.taxGroup.name;


            if (finalProductBrand.productCategory) {
                itemMaster.productCategory = finalProductBrand.productCategory._id;
                itemMaster.productName = finalProductBrand.productCategory.name;
                itemMaster.productType = finalProductBrand.productCategory.type;
                itemMaster.productCode = finalProductBrand.productCategory.code;
                itemMaster.productDescription = finalProductBrand.productCategory.description;
                if (finalProductBrand.productCategory.parent) {
                    itemMaster.productSubCategory = finalProductBrand.productCategory.parent._id;
                    itemMaster.productSubCategoryName = finalProductBrand.productCategory.parent.name;
                }
                if (finalProductBrand.productCategory.grandParent) {
                    itemMaster.productMainCategory = finalProductBrand.productCategory.grandParent._id;
                    itemMaster.productMainCategoryName = finalProductBrand.productCategory.grandParent.name;
                }
            }

            if (moqVsMarginHeaderNames && movVsMarginHeaderNames.length > 0) {
                itemMaster.moqAndMargin = getMargins(eachLineData, header, moqVsMarginHeaderNames, warnings, 'MOQ');
            }
            if (movVsMarginHeaderNames && movVsMarginHeaderNames.length > 0) {
                itemMaster.movAndMargin = getMargins(eachLineData, header, movVsMarginHeaderNames, warnings, 'MOV');
            }
            if (eachLineData.lineData[header.indexOf('Alternative.NumberOfUnits')]) {
                itemMaster.altNumberOfUnits = eachLineData.lineData[header.indexOf('Alternative.NumberOfUnits')];
            }
            if (eachLineData.lineData[header.indexOf('Alternative.MRP')]) {
                itemMaster.altMRP = eachLineData.lineData[header.indexOf('Alternative.MRP')];
            }
            if (eachLineData.lineData[header.indexOf('GradeLoss')]) {
                itemMaster.gradingLoss = Number(eachLineData.lineData[header.indexOf('GradeLoss')]).valueOf();
            }
            if (eachLineData.lineData[header.indexOf('WeightLossPercentage')]) {
                itemMaster.weightLoss = {percentage: Number(eachLineData.lineData[header.indexOf('WeightLossPercentage')]).valueOf()};
            }
            if (eachLineData.lineData[header.indexOf('WeightLossDuration')]) {
                if (!itemMaster.weightLoss) {
                    itemMaster.weightLoss = {duration: 0, percentage: 0};
                }
                itemMaster.weightLoss.duration = Number(eachLineData.lineData[header.indexOf('WeightLossDuration')]).valueOf();
            }
            findOrCreateAlternativeUOM(eachLineData, header, user, function (alterNativeErr, alternativeUnitOfMeasure) {
                if (alterNativeErr) {
                    importLogger.error(errorHandler.getErrorMessage(alternativeUnitOfMeasure));
                    /* done(alterNativeErr);*/
                } else {
                    if (alternativeUnitOfMeasure && alternativeUnitOfMeasure._id) {
                        itemMaster.altUnitOfMeasure = alternativeUnitOfMeasure._id;
                    }
                    getContainers(eachLineData, header, containerHeaderNames, warnings, function (err, containers) {
                        if (err) {
                            importLogger.error(errorHandler.getErrorMessage(err));
                            //done(err);
                            done(err);
                        } else {
                            if (containers) {
                                itemMaster.containers = containers;
                            }
                            var date = Date.now();
                            itemMaster.set('created', date);
                            itemMaster.set('lastUpdated', date);
                            itemMaster.user = user;
                            itemMaster.company = user.company;
                            itemMaster.lastUpdatedUser = user;
                            itemMaster.businessUnit = businessUnit;

                            itemMaster.save(function (saveItemMasterErr) {
                                if (saveItemMasterErr) {
                                    importLogger.error(errorHandler.getErrorMessage(saveItemMasterErr));
                                    if (warnings && warnings.length > 0) {
                                        done(saveItemMasterErr, warnings);
                                    } else {
                                        done(saveItemMasterErr, itemMaster, warnings);
                                    }

                                } else {
                                    done(null, itemMaster, warnings);
                                }


                            });


                        }

                    });
                }

            });
        }
    });
}

/**
 *
 * @param productBrand
 * @param unitOfMeasureId
 * @param done
 */
function updateProductBrandUOM(productBrandId,categoryId,unitOfMeasureId,alternativeUnitMeasureId,done) {
    if(categoryId && productBrandId && (unitOfMeasureId || alternativeUnitMeasureId)) {
        var uomFields;
        if (unitOfMeasureId && alternativeUnitMeasureId) {
            Category.findOneAndUpdate(
                {_id: categoryId},
                {$addToSet: {'unitOfMeasures': [unitOfMeasureId,alternativeUnitMeasureId]}},
                function (addUOMAtCategoryErr, addUOMAtCategory) {
                    if (addUOMAtCategoryErr) {
                        done(addUOMAtCategoryErr, null);
                    } else if (addUOMAtCategory) {
                        ProductBrand.findOneAndUpdate(
                            {_id: productBrandId},
                            {$addToSet: {'unitOfMeasures': unitOfMeasureId}},
                            function (addUOMAtProductBrandErr, addUOMAtProductBrand) {
                                if (addUOMAtProductBrandErr) {
                                    done(addUOMAtProductBrandErr, null);
                                } else if (!addUOMAtProductBrand || !addUOMAtProductBrand._id) {
                                    done(new Error('Fail to add UOM at Brand'), null);
                                } else {
                                    done(null, unitOfMeasureId);
                                }
                            });
                    } else {
                        done(new Error('Fail to add UOM at Category'), null);
                    }
                }); uomFields = '[' + unitOfMeasureId + ',' + alternativeUnitMeasureId + ']';
        } else if (unitOfMeasureId) {
            Category.findOneAndUpdate(
                {_id: categoryId},
                {$addToSet: {'unitOfMeasures': unitOfMeasureId}},
                function (addUOMAtCategoryErr, addUOMAtCategory) {
                    if (addUOMAtCategoryErr) {
                        done(addUOMAtCategoryErr, null);
                    } else if (addUOMAtCategory) {
                        ProductBrand.findOneAndUpdate(
                            {_id: productBrandId},
                            {$addToSet: {'unitOfMeasures': unitOfMeasureId}},
                            function (addUOMAtProductBrandErr, addUOMAtProductBrand) {
                                if (addUOMAtProductBrandErr) {
                                    done(addUOMAtProductBrandErr, null);
                                } else if (!addUOMAtProductBrand || !addUOMAtProductBrand._id) {
                                    done(new Error('Fail to add UOM at Brand'), null);
                                } else {
                                    done(null, unitOfMeasureId);
                                }
                            });
                    } else {
                        done(new Error('Fail to add UOM at Category'), null);
                    }
                }); uomFields = '[' + unitOfMeasureId + ',' + alternativeUnitMeasureId + ']';
        } else if (alternativeUnitMeasureId) {
            Category.findOneAndUpdate(
                {_id: categoryId},
                {$addToSet: {'unitOfMeasures': unitOfMeasureId}},
                function (addUOMAtCategoryErr, addUOMAtCategory) {
                    if (addUOMAtCategoryErr) {
                        done(addUOMAtCategoryErr, null);
                    } else if (addUOMAtCategory) {
                        ProductBrand.findOneAndUpdate(
                            {_id: productBrandId},
                            {$addToSet: {'unitOfMeasures': unitOfMeasureId}},
                            function (addUOMAtProductBrandErr, addUOMAtProductBrand) {
                                if (addUOMAtProductBrandErr) {
                                    done(addUOMAtProductBrandErr, null);
                                } else if (!addUOMAtProductBrand || !addUOMAtProductBrand._id) {
                                    done(new Error('Fail to add UOM at Brand'), null);
                                } else {
                                    done(null, unitOfMeasureId);
                                }
                            });
                    } else {
                        done(new Error('Fail to add UOM at Category'), null);
                    }
                }); uomFields = '[' + unitOfMeasureId + ',' + alternativeUnitMeasureId + ']';
        }else{
            done(new Error('No Unit Of Measure'),null);
        }

    }else{
        done(new Error('No Unit Of Measure'),null);
    }

}
exports.updateProductBrandUOM=function(productBrandId,categoryId,unitOfMeasureId,altUnitOfMeasure,done){
    updateProductBrandUOM(productBrandId,categoryId,unitOfMeasureId,altUnitOfMeasure,function (err,unitOfMeasure) {
        done(err,unitOfMeasure);
    });
};
function getUOMName(unitOfMeasure,fieldValue) {
    if(unitOfMeasure.symbol===fieldValue){
        return unitOfMeasure.symbol;
    }else if(unitOfMeasure.name===fieldValue){
        return unitOfMeasure.name;
    }else{
        return '';
    }

}
function findOneUOMQuery(data,done) {
    UnitOfMeasure.findOne(data, function (unitOfMeasureError, unitOfMeasure) {
        done(unitOfMeasureError,unitOfMeasure);
    });
}
function findUnitOfMeasureByName(key,header,eachLineData,isNotRequired,done){
    var uom=eachLineData.lineData[header.indexOf(key)];
    if(uom && uom.length>0) {
        findOneUOMQuery({
            $or: [{'symbol': uom}, {'name': uom}],
            'type': 'Simple'
        }, function (unitOfMeasureError, unitOfMeasure) {
            if (unitOfMeasureError) {
                done(unitOfMeasureError, unitOfMeasure,uom);
            } else {
                if (unitOfMeasure || isNotRequired) {
                    done(null, unitOfMeasure,uom);
                } else {
                    done(new Error('No UOM with Name :' + uom), null,uom);
                }
            }

        });
    }else{
        if(isNotRequired){
            done(null,null,null);
        }else{
            done(new Error('No UOM with Name :' + uom), null,uom);
        }
    }

}
/**
 *
 * @param firstUOM
 * @param conversion
 * @param secondUOM
 * @param user
 * @param done
 */

function findOrCreateUOM(keyFields,header,eachLineData,user,isOptional,done) {
    var conversion = Number(eachLineData.lineData[header.indexOf(keyFields.conversion)]).valueOf();
    findUnitOfMeasureByName(keyFields.firstUOM,header,eachLineData,isOptional, function (unitOfMeasureError, firstUnitOfMeasure,firstUOM) {
        if(unitOfMeasureError){
            done(unitOfMeasureError, firstUnitOfMeasure);
        }else {
            importLogger.debug('First UOM-' +(firstUnitOfMeasure? firstUnitOfMeasure.name:''));
            findUnitOfMeasureByName(keyFields.secondUOM,header,eachLineData,true, function (secondUnitOfMeasureError,secondUnitOfMeasure,secondUOM) {
                if (secondUnitOfMeasureError) {
                    importLogger.error(errorHandler.getErrorMessage(secondUnitOfMeasureError));
                    done(secondUnitOfMeasureError, null);
                } else if (secondUnitOfMeasure) {
                    findOneUOMQuery({
                        'firstUnitOfMeasure': firstUnitOfMeasure._id,
                        'secondUnitOfMeasure': secondUnitOfMeasure._id,
                        'conversion': conversion,
                        'type': 'Compound'
                    }, function (unitOfMeasureErr, compoundUnitOfMeasure) {
                        if (unitOfMeasureErr) {
                            importLogger.error(errorHandler.getErrorMessage(unitOfMeasureErr));
                            done(unitOfMeasureErr, null);
                        } else if (compoundUnitOfMeasure) {
                            importLogger.debug('Compound unit of measure with symbol  -' + compoundUnitOfMeasure.symbol + ' exists');
                            done(null, compoundUnitOfMeasure);
                        } else {
                            importLogger.warn('Creating Compound unit of measure with firstUOM -' + firstUOM + ', conversion - ' + conversion + ' and secondUOM-' + secondUOM);
                            //logger.debug('No Compound unit of measure with firstUOM -' + firstUOM + ', conversion - ' + conversion + ' and secondUOM-' + secondUOM);
                            var unitOfMeasure = new UnitOfMeasure();
                            var date = Date.now();
                            unitOfMeasure.set('created', date);
                            unitOfMeasure.set('lastUpdated', date);
                            unitOfMeasure.user = user;
                            unitOfMeasure.lastUpdatedUser = user;
                            var firstUOMName = getUOMName(firstUnitOfMeasure, firstUOM);
                            var secondUOMName = getUOMName(secondUnitOfMeasure, secondUOM);
                            unitOfMeasure.name = firstUOMName + ' Of ' + conversion +' ' +secondUOMName;
                            unitOfMeasure.description = firstUOMName + ' Of ' + conversion+' ' + secondUOMName;
                            unitOfMeasure.symbol = firstUOMName + ' (' + conversion +' '+ secondUOMName + ')';
                            unitOfMeasure.quantityType = secondUnitOfMeasure.quantityType;
                            unitOfMeasure.firstUnitOfMeasure = firstUnitOfMeasure._id;
                            unitOfMeasure.secondUnitOfMeasure = secondUnitOfMeasure._id;
                            unitOfMeasure.conversion = conversion;
                            unitOfMeasure.type = 'Compound';
                            unitOfMeasure.save(function (unitOfMeasureErr) {
                                if (unitOfMeasureErr) {
                                    done(unitOfMeasureErr);
                                } else {
                                    done(null, unitOfMeasure);
                                }
                            });
                        }

                    });
                } else {
                    done(null, firstUnitOfMeasure);
                }
            });
        }

    });
}
exports.findOrCreatePrimaryUOM=function(eachLineData,header,user, done) {
    // Create Primary UOM
    var keyFields={'conversion':'UOM.Conversion','firstUOM':'UOM.FirstUOM','secondUOM':'UOM.SecondUOM'};
    findOrCreateUOM(keyFields,header,eachLineData,user,false,function(uomError,primaryUOM){
        done(uomError,primaryUOM);
    });

};
function findOrCreateAlternativeUOM(eachLineData,header,user, done) {
    // Create Alternative UOM
    var keyFields={'conversion':'Alternative.Conversion','firstUOM':'Alternative.FirstUOM','secondUOM':'Alternative.SecondUOM'};
    findOrCreateUOM(keyFields,header,eachLineData,user,true,function(uomError,secondaryUOM){
        done(uomError,secondaryUOM);
    });

}
/**
 *
 * @param productBrand
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */
exports.findOrCreateItemMaster=function(productBrand, header, eachLineData, user,businessUnit, done) {
    _this.findOrCreatePrimaryUOM(eachLineData,header, user, function (unitOfMeasureErr, unitOfMeasure) {
        if (unitOfMeasureErr) {
            importLogger.error(errorHandler.getErrorMessage(unitOfMeasureErr));
            done(unitOfMeasureErr);
        } else {
            ItemMaster.findOne({
                'productBrand': productBrand._id,
                'unitOfMeasure': unitOfMeasure._id
            }, function (itemMasterErr, itemMaster) {
                if (itemMasterErr) {
                    importLogger.error(errorHandler.getErrorMessage(itemMasterErr));

                    done(itemMasterErr);
                } else if (itemMaster) {
                    eachLineData.nvipaniData = true;
                    //logger.warn('Item master with product brand name - ' + productBrand.name + ', brand variety -' + productBrand.variety + ' and unit of measure -' + unitOfMeasure.symbol + ' already present');
                    done(null, itemMaster);
                } else {
                    importLogger.debug('Creating Item Master with product brand name - ' + productBrand.name + ', brand variety -' + productBrand.variety + ' and unit of measure -' + unitOfMeasure.symbol);
                    var warnings = [];
                    createItemMaster(productBrand, unitOfMeasure, header, eachLineData, user, warnings, businessUnit, function (createItemMasterErr, createItemMaster, warnings) {
                        done(createItemMasterErr, createItemMaster, warnings);
                    });
                }
            });
        }
    });
};

/**
 *
 * @param contactHeader
 * @param contactHeaders
 * @param header
 * @param eachLineData
 * @param phones
 * @param emails
 * @param user
 * @param done
 */
function createContact(contactHeader, contactHeaders, header, eachLineData, phones, emails, user, done) {
    var contactName = eachLineData.lineData[header.indexOf(contactHeader + '.Name')];
    var contactCompany = eachLineData.lineData[header.indexOf(contactHeader + '.Company')];

    var contact = new Contact({
        firstName: contactName,
        displayName: contactCompany,
        companyName: contactCompany,
        customerType: 'Supplier'
    });


    for (var i = 0; i < phones.length; i++) {
        contact.phones.push({phoneNumber: phones[i], phoneType: 'Mobile'});
    }
    for (i = 0; i < emails.length; i++) {
        contact.emails.push({email: emails[i], emailType: 'Work'});
    }
    //BrandOwner.GSTIN
    var gstIn = eachLineData.lineData[header.indexOf(contactHeader + '.GSTIN')];
    if(gstIn){
        contact.gstinNumber = gstIn;
    }
    //BrandOwner.AddressLine	BrandOwner.City	BrandOwner.State	BrandOwner.Country	BrandOwner.PinCode
    var addressLine = eachLineData.lineData[header.indexOf(contactHeader + '.AddressLine')];
    var city = eachLineData.lineData[header.indexOf(contactHeader + '.City')];
    var state = eachLineData.lineData[header.indexOf(contactHeader + '.State')];
    var country = eachLineData.lineData[header.indexOf(contactHeader + '.Country')];
    var pinCode = eachLineData.lineData[header.indexOf(contactHeader + '.PinCode')];

    contact.addresses.push({
        addressLine: addressLine,
        city: city,
        state: state,
        country: country,
        pinCode: pinCode,
        addressType: 'Billing'
    });
    importLogger.debug('Creating the contact -' + JSON.stringify(contact));
    var date = Date.now();
    contact.set('created', date);
    contact.set('lastUpdated', date);
    contact.user = user;
    contact.lastUpdatedUser = user;
    contact.company=user.company;
    // Following code needs to refactored
    User.findOne({
        username: {$in: phones},
        status: 'Registered'
    }, '-salt -password', function (nVipaniUserError, nVipaniUser) {
        if (nVipaniUserError) {
            importLogger.error(errorHandler.getErrorMessage(nVipaniUserError));
            done(nVipaniUserError);
        } else if (nVipaniUser) {
            contact.nVipaniUser = nVipaniUser;
            contact.nVipaniCompany = nVipaniUser.company;
            contact.save(function (saveContactErr) {
                if (saveContactErr) {
                    importLogger.error(errorHandler.getErrorMessage(saveContactErr));
                    done(saveContactErr);
                } else {
                    done(null, contact);
                }
            });
        } else {
            User.findOne({
                username: {$in: emails},
                status: 'Registered'
            }, '-salt -password', function (nVipaniEmailUserError, nVipaniEmailUser) {
                if (nVipaniEmailUserError) {
                    importLogger.error(errorHandler.getErrorMessage(nVipaniEmailUserError));
                    done(nVipaniEmailUserError);
                } else if (nVipaniEmailUser) {
                    contact.nVipaniUser = nVipaniEmailUser;
                    contact.nVipaniCompany = nVipaniEmailUser.company;
                    contact.save(function (saveContactErr) {
                        if (saveContactErr) {
                            importLogger.error(errorHandler.getErrorMessage(saveContactErr));
                            done(saveContactErr);
                        } else {
                            done(null, contact);
                        }
                    });
                } else {
                    contact.save(function (saveContactErr) {
                        if (saveContactErr) {
                            importLogger.error(errorHandler.getErrorMessage(saveContactErr));
                            done(saveContactErr);
                        } else {
                            done(null, contact);
                        }
                    });
                }
            });
        }
    });


}
/**
 *
 * @param contactHeader
 * @param contactHeaders
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */
function findOrCreateContact(contactHeader, contactHeaders, header, eachLineData, user, done) {

    // Phones
    var contactPhoneHeaderNames = contactHeaders.filter(function (contactPhoneHeaderName) {
        return (contactPhoneHeaderName && contactPhoneHeaderName !== '' && contactPhoneHeaderName.startsWith(contactHeader + '.Phone'));
    });
    var phones = [];
    for (var i = 0; i < contactPhoneHeaderNames.length; i++) {
        if (eachLineData.lineData[header.indexOf(contactPhoneHeaderNames[i])] && eachLineData.lineData[header.indexOf(contactPhoneHeaderNames[i])] !== '') {
            phones.push(eachLineData.lineData[header.indexOf(contactPhoneHeaderNames[i])]);
        }

    }
    // Emails
    var contactEmailHeaderNames = contactHeaders.filter(function (contactEmailHeaderName) {
        return (contactEmailHeaderName && contactEmailHeaderName !== '' && contactEmailHeaderName.startsWith(contactHeader + '.Email'));
    });
    var emails = [];
    for (i = 0; i < contactEmailHeaderNames.length; i++) {
        if (eachLineData.lineData[header.indexOf(contactEmailHeaderNames[i])] && eachLineData.lineData[header.indexOf(contactEmailHeaderNames[i])] !== '') {
            emails.push(eachLineData.lineData[header.indexOf(contactEmailHeaderNames[i])]);
        }
    }
    importLogger.debug(contactHeader + ' Header Names -' + JSON.stringify(contactHeaders));
    importLogger.debug(' Phones -' + JSON.stringify(phones));
    importLogger.debug(' Emails -' + JSON.stringify(emails));
    if (phones.length !== 0 || emails.length !== 0) {

        Contact.findOne({'phones.phoneNumber': {$in: phones}}, function (contactError, contact) {
            if (contactError) {
                importLogger.error(errorHandler.getErrorMessage(contactError));
                done(contactError);
            } else if (contact) {
                importLogger.debug('Found Phone Contact -' + JSON.stringify(contact));
                done(null, contact);
            } else {
                Contact.findOne({'emails.email': {$in: emails}}, function (emailContactError, emailContact) {
                    if (emailContactError) {
                        importLogger.error(errorHandler.getErrorMessage(emailContactError));
                        done(emailContactError);
                    } else if (emailContact) {
                        importLogger.debug('Found Email Contact -' + JSON.stringify(contact));
                        done(null, emailContact);
                    } else {
                        createContact(contactHeader, contactHeaders, header, eachLineData, phones, emails, user, function (createContactErr, createContact) {
                            if (createContactErr) {
                                importLogger.error(errorHandler.getErrorMessage(createContactErr));
                                done(createContactErr);
                            } else if (createContact) {
                                done(null, createContact);
                            }
                        });
                    }
                });
            }
        });
    } else {
        importLogger.warn('Contact can not be created without any phone numbers or emails.');
        done();
    }

}

/**
 *
 * @param contactHeader
 * @param contactHeaders
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */

function findOrCreateContacts(contactHeader, contactHeaders, header, eachLineData, user, done) {

    var productBrandManufacturerCompanyHeaderNames = header.filter(function (productBrandManufacturerCompanyHeaderName) {
        return (productBrandManufacturerCompanyHeaderName && productBrandManufacturerCompanyHeaderName !== '' && productBrandManufacturerCompanyHeaderName.startsWith(contactHeader) && productBrandManufacturerCompanyHeaderName.endsWith('.Company'));
    });

    if (productBrandManufacturerCompanyHeaderNames && productBrandManufacturerCompanyHeaderNames.length > 0) {
        var results = {contacts: [], contactIds: []};
        async.forEachSeries(productBrandManufacturerCompanyHeaderNames, function (productBrandManufacturerCompanyHeaderName, callback) {
            var eachContactHeader = productBrandManufacturerCompanyHeaderName.substring(0, productBrandManufacturerCompanyHeaderName.indexOf('.Company'));
            var eachContactHeaders = contactHeaders.filter(function (eachContactHeader) {
                return (eachContactHeader && eachContactHeader !== '' && eachContactHeader.startsWith(eachContactHeader));
            });
            importLogger.debug(eachContactHeader + ' Header Names -' + JSON.stringify(eachContactHeaders));
            findOrCreateContact(eachContactHeader, eachContactHeaders, header, eachLineData, user, function (contactErr, contact) {
                if (contactErr) {
                    importLogger.error(errorHandler.getErrorMessage(contactErr));
                    callback();
                }else if(!contact){
                    importLogger.error('No Contact');
                    callback();
                } else if (contact) {
                    results.contacts.push(contact);
                    results.contactIds.push(contact._id);
                    callback();
                }
            });
        }, function (err) {
            if (err) {
                importLogger.error(errorHandler.getErrorMessage(err));
                done(err);
            } else {
                done(null, results);
            }
        });
    }


}
function findHsnCode(query,done) {
    HsnCode.findOne(query, function (hsnCodeErr, hsnCode) {
        done(hsnCodeErr,hsnCode);

    });


}
function findTaxGroup(query,done) {
    TaxGroup.findOne(query, function (taxGroupErr, taxGroup) {
        done(taxGroupErr,taxGroup);

    });

}
function findUnitOfMeasure(firstUOM,conversion,secondUOM,done) {
    UnitOfMeasure.findOne({
        'name': firstUOM + ' Of ' + conversion + secondUOM,
        'conversion': conversion,
        'type': 'Compound'
    }, function (unitOfMeasureErr, unitOfMeasure) {
        done(unitOfMeasureErr,unitOfMeasure);

    });
}
function findUnitOfMeasureAtProduct(productCategoryId,unitOfMeasureId,done) {
    UnitOfMeasure.findOne({
        'unitOfMeasures.unitMeasure': unitOfMeasureId,
        '_id': productCategoryId
    }, function (uomProductCategoryErr, uomProductCategory) {
        done(uomProductCategoryErr,uomProductCategory);

    });
}
function findUnitOfMeasureAtProductBrand(productBrandId,unitOfMeasureId,done) {
    ProductBrand.findOne({
        'unitOfMeasures.unitMeasure': unitOfMeasureId,
        '_id': productBrandId
    }, function (uomProductBrandErr, uomProductBrand) {
        done(uomProductBrandErr,uomProductBrand);

    });
}
function findHsnCodeTaxGroupUOM(eachLineData,header,user,done) {
    var hsncodeToMatch = eachLineData.lineData[header.indexOf('HSNCode')];
    var taxGroupToMatch=eachLineData.lineData[header.indexOf('TaxGroup')];
    findHsnCode({'hsncode':{$in:[hsncodeToMatch,'0'+hsncodeToMatch]}}, function (hsnCodeErr, hsnCode) {
        if (hsnCodeErr) {
            done(hsnCodeErr,hsnCode,null,null);
        }else if(!hsnCode){
            logger.error('No HSN Code with the number :'+hsncodeToMatch+' At line:'+eachLineData.srcLine);
            done(new Error('No HSN Code with the number :'+hsncodeToMatch),hsnCode,null);
        } else {
            findTaxGroup({'name': taxGroupToMatch}, function (taxGroupErr, taxGroup) {
                if (taxGroupErr) {
                    importLogger.error(errorHandler.getErrorMessage(taxGroupErr));
                    done(taxGroupErr,null,null);
                }
                else if(!taxGroup){
                    var error = 'No tax group was found for '+taxGroupToMatch+' At line:'+eachLineData.srcLine;
                    importLogger.error(error);
                    done(new Error(error),null,null,null);
                }else{
                    _this.findOrCreatePrimaryUOM(eachLineData,header, user, function (unitOfMeasureErr, unitOfMeasure) {
                        if (unitOfMeasureErr) {
                            importLogger.error(errorHandler.getErrorMessage(unitOfMeasureErr));
                            done(unitOfMeasureErr);
                        }
                        else if (!unitOfMeasure) {
                            var error = 'No matching uom was found for line:' + eachLineData.srcLine;
                            importLogger.error(error);
                            done(new Error(error));
                        } else {
                            done(null,hsnCode,taxGroup,unitOfMeasure);
                        }
                    });
                }
            });
        }
    });
}
/**
 *
 * @param subCategory1
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */
function createProductCategory(subCategory1, header, eachLineData, user, done) {
    // Create Product Category
    var productName = eachLineData.lineData[header.indexOf('ProductName')];
    var productCode = eachLineData.lineData[header.indexOf('ProductCode')];
    importLogger.debug('Creating product category with name-' + productName + ' and product category code -' + productCode);
    var productCategory = new Category({
        name: productName,
        code: productCode,
        hsnCodes:[],
        unitOfMeasures:[],
        taxGroups:[],
        productCategory: true,
        type: 'SubCategory2'
    });
    productCategory.parent = subCategory1._id;
    productCategory.grandParent=subCategory1.parent;
    var productAliasHeaderNames = header.filter(function (productAliasHeaderName) {
        return (productAliasHeaderName && productAliasHeaderName !== '' && productAliasHeaderName.startsWith('ProductAlias'));
    });
    for (var i = 0; i < productAliasHeaderNames.length; i++) {
        productCategory.aliases.push(eachLineData.lineData[header.indexOf(productAliasHeaderNames[i])]);
    }
    var productSuperClassificationHeaderNames = header.filter(function (productSuperClassificationHeaderName) {
        return (productSuperClassificationHeaderName && productSuperClassificationHeaderName !== '' && productSuperClassificationHeaderName.startsWith('ProductSuperClassification'));
    });
    for (i = 0; i < productSuperClassificationHeaderNames.length; i++) {
        productCategory.superClassification.push(eachLineData.lineData[header.indexOf(productSuperClassificationHeaderNames[i])]);
    }
    //TODO: Grade and Quality parameters needs to be set to the product category
    productCategory.productAttributes = {};
    productCategory.productAttributes.brand = true;
    productCategory.productAttributes.grade = {};
    productCategory.productAttributes.grade.enabled = true;
    productCategory.productAttributes.grade.definition = [];
    productCategory.productAttributes.quality = {};
    productCategory.productAttributes.quality.enabled = true;
    productCategory.productAttributes.quality.definition = [];

    var productBrandGradeHeaderNames = header.filter(function (productBrandGradeHeaderName) {
        return (productBrandGradeHeaderName && productBrandGradeHeaderName !== '' && productBrandGradeHeaderName.startsWith('Grade.'));
    });
    var productBrandQualityHeaderNames = header.filter(function (productBrandQualityHeaderName) {
        return (productBrandQualityHeaderName && productBrandQualityHeaderName !== '' && productBrandQualityHeaderName.startsWith('Quality.'));
    });
    for ( i = 0; i < productBrandGradeHeaderNames.length; i++) {
        var gradeHeader = productBrandGradeHeaderNames[i];
        productCategory.productAttributes.grade.definition.push({'attributeKey': gradeHeader.substring(gradeHeader.indexOf('Grade.') + 6),'attributeValue':  eachLineData.lineData[header.indexOf(gradeHeader)]});
    }

    for (i = 0; i < productBrandQualityHeaderNames.length; i++) {
        var qualityHeader = productBrandQualityHeaderNames[i];
        productCategory.productAttributes.quality.definition.push({'attributeKey': qualityHeader.substring(qualityHeader.indexOf('Quality.') + 8),'attributeValue':  eachLineData.lineData[header.indexOf(qualityHeader)]});
    }

    productCategory.description = eachLineData.lineData[header.indexOf('ProductDescription')];

    findHsnCodeTaxGroupUOM(eachLineData,header,user,function (hsnTaxGroupUOMErr,hsnCode,taxGroup,unitOfMeasure) {
        if (hsnTaxGroupUOMErr) {
            importLogger.error(errorHandler.getErrorMessage(hsnTaxGroupUOMErr));
            done(hsnTaxGroupUOMErr);
        }else {
            findOrCreateAlternativeUOM(eachLineData,header,user,function (alterNativeErr,alternativeUnitOfMeasure) {
                if (alternativeUnitOfMeasure) {
                    importLogger.error(errorHandler.getErrorMessage(alternativeUnitOfMeasure));
                    done(alternativeUnitOfMeasure);
                } else {

                    var date = Date.now();
                    productCategory.set('created', date);
                    productCategory.set('lastUpdated', date);
                    productCategory.user = user;
                    productCategory.lastUpdatedUser = user;
                    productCategory.unitOfMeasures.push(unitOfMeasure._id);
                    if(alternativeUnitOfMeasure && alternativeUnitOfMeasure._id) {
                        productCategory.unitOfMeasures.push(alternativeUnitOfMeasure._id);
                    }
                    productCategory.hsnCodes.push(hsnCode._id);
                    productCategory.taxGroups.push(taxGroup._id);
                    productCategory.save(function (saveProductCategoryErr) {
                        if (saveProductCategoryErr) {
                            importLogger.error(errorHandler.getErrorMessage(saveProductCategoryErr));
                            done(saveProductCategoryErr);
                        } else {
                            subCategory1.children.push(productCategory._id);
                            subCategory1.save(function (saveSubCategory1Err) {
                                if (saveSubCategory1Err) {
                                    importLogger.error(errorHandler.getErrorMessage(saveSubCategory1Err));
                                    done(saveSubCategory1Err);
                                } else {
                                    done(null, productCategory);
                                }
                            });

                        }
                    });
                }
            });
        }

    });


}



/**
 *
 * @param subCategory1
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */
exports.findOrCreateProductCategory=function(query, header, eachLineData, user, done) {
    var productName = eachLineData.lineData[header.indexOf('ProductName')];
    var productCode = eachLineData.lineData[header.indexOf('ProductCode')];
    _this.findQueryByCategories(query, 1, function (categoriesErr, categories) {
        if (categoriesErr) {
            importLogger.error(errorHandler.getErrorMessage(categoriesErr));
            done(new Error('No Matched records with Subcategory :'+errorHandler.getErrorMessage(categoriesErr)));
        } else if (categories.length === 0) {
            importLogger.error(errorHandler.getErrorMessage('No Matched records with Subcategory :'+query));
            done(new Error('No Matched records with Subcategory :'+query));
        } else if (categories.length > 0) {
            var subCategory1 = categories[0];
            if (subCategory1.children && subCategory1.children.length > 0) {
                var products = subCategory1.children.filter(function (productCategory) {
                    return (productCategory.code === productCode && productCategory.type === 'SubCategory2');
                });
                if (products.length > 0) {
                    if (products[0].name && products[0].name !== productName) {
                        var warn = 'The actual product category name -' + products[0].name + ' is different from the imported product category name-' + productName + ' for the product category with code-' + productCode;
                        importLogger.warn(warn);
                    }
                    done('', products[0]);
                } else {
                    createProductCategory(subCategory1, header, eachLineData, user, function (createProductCategoryErr, productCategory) {
                        done(createProductCategoryErr, productCategory);
                    });
                }
            } else {
                createProductCategory(subCategory1, header, eachLineData, user, function (createProductCategoryErr, productCategory) {
                    done(createProductCategoryErr, productCategory);
                });
            }
        }
    });
};

/**
 *
 * @param productCategory
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */
function createProductBrand(productCategory, header, eachLineData, user, done) {
    // Create Product Brand
    var brandName = eachLineData.lineData[header.indexOf('BrandName')];
    var brandVariety = eachLineData.lineData[header.indexOf('BrandVariety')];
    importLogger.debug('Creating product brand with name-' + brandName + ' and brand variety -' + brandVariety);
    var brandDescription = eachLineData.lineData[header.indexOf('BrandDescription')];
    var productBrand = new ProductBrand({
        name: brandName,
        variety: brandVariety,
        description: brandDescription
    });
    productBrand.productCategory = productCategory._id;

    var productBrandOwnerHeaderNames = header.filter(function (productBrandOwnerHeaderName) {
        return (productBrandOwnerHeaderName && productBrandOwnerHeaderName !== '' && productBrandOwnerHeaderName.startsWith('BrandOwner'));
    });

    var productBrandManufacturerHeaderNames = header.filter(function (productBrandManufacturerHeaderName) {
        return (productBrandManufacturerHeaderName && productBrandManufacturerHeaderName !== '' && productBrandManufacturerHeaderName.startsWith('Manufacturer'));
    });

    var productBrandGradeHeaderNames = header.filter(function (productBrandGradeHeaderName) {
        return (productBrandGradeHeaderName && productBrandGradeHeaderName !== '' && productBrandGradeHeaderName.startsWith('Grade.'));
    });
    var productBrandQualityHeaderNames = header.filter(function (productBrandQualityHeaderName) {
        return (productBrandQualityHeaderName && productBrandQualityHeaderName !== '' && productBrandQualityHeaderName.startsWith('Quality.'));
    });
    for (var i = 0; i < productBrandGradeHeaderNames.length; i++) {
        var gradeHeader = productBrandGradeHeaderNames[i];
        productBrand.gradeDefinition.push({
            'attributeKey': gradeHeader.substring(gradeHeader.indexOf('Grade.') + 6),
            'attributeValue': eachLineData.lineData[header.indexOf(gradeHeader)]
        });
    }

    for (i = 0; i < productBrandQualityHeaderNames.length; i++) {
        var qualityHeader = productBrandQualityHeaderNames[i];
        productBrand.qualityDefinition.push({
            'attributeKey': qualityHeader.substring(qualityHeader.indexOf('Quality.') + 8),
            'attributeValue': eachLineData.lineData[header.indexOf(qualityHeader)]
        });
    }
    findHsnCodeTaxGroupUOM(eachLineData,header,user,function (hsnTaxGroupUOMErr,hsnCode,taxGroup,unitOfMeasure) {
        if (hsnTaxGroupUOMErr) {
            done(hsnTaxGroupUOMErr);
        }else {
            importLogger.debug('Brand Owner Header Names -' + JSON.stringify(productBrandOwnerHeaderNames));
            findOrCreateContact('BrandOwner', productBrandOwnerHeaderNames, header, eachLineData, user, function (brandOwnerErr, brandOwner) {
                if (brandOwnerErr) {
                    importLogger.error(errorHandler.getErrorMessage(brandOwnerErr));
                    done(brandOwnerErr);
                }
                else {
                    importLogger.debug('Manufacturer Header Names -' + JSON.stringify(productBrandManufacturerHeaderNames));
                    findOrCreateContacts('Manufacturer', productBrandManufacturerHeaderNames, header, eachLineData, user, function (manufacturersErr, manufacturers) {
                        if (manufacturersErr) {
                            importLogger.error(errorHandler.getErrorMessage(manufacturersErr));
                            done(manufacturersErr);
                        }else {
                            importLogger.debug('Creating Product Brand with product brand name - ' + productBrand.name + ', brand variety -' + productBrand.variety);
                            if(manufacturers.contacts.length>0)
                                importLogger.debug('Manufacturer name -' + manufacturers.contacts[0].firstName + ' and company name-' + manufacturers.contacts[0].companyName);
                            var date = Date.now();
                            productBrand.set('created', date);
                            productBrand.set('lastUpdated', date);
                            productBrand.user = user;
                            productBrand.lastUpdatedUser = user;
                            productBrand.unitOfMeasures.push(unitOfMeasure._id);
                            productBrand.hsncode = hsnCode._id;
                            productBrand.taxGroup = taxGroup._id;
                            if (brandOwner) {
                                logger.debug(' and brand owner name -' + brandOwner.firstName + ' and company name-' + brandOwner.companyName);
                                productBrand.brandOwner = brandOwner._id;
                            }
                            if (manufacturers && manufacturers.contactIds) {
                                productBrand.manufacturers = manufacturers.contactIds;
                            }
                            productBrand.save(function (saveProductBrandErr) {
                                if (saveProductBrandErr) {
                                    importLogger.error(errorHandler.getErrorMessage(saveProductBrandErr));
                                    done(saveProductBrandErr);
                                } else {
                                    ProductBrand.findById(productBrand._id).populate('hsncode taxGroup').exec(function (brandErr,eachBrand) {
                                        done(brandErr, eachBrand);
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
function findOrAddProductBrandInCategory(categoryId,brandId,done) {
    Category.findOne({
        '_id': categoryId,
        'productBrands': {$in:[brandId]}
    },function (brandErr,category) {
        if(brandErr || category){
            done(brandErr, category);
        }else {
            Category.findOneAndUpdate(
                {_id: categoryId}, {
                    $addToSet: {
                        'productBrands': brandId
                    }
                }, function (err,updateBrand) {
                    done(err, updateBrand);
                });
        }
    });

}

/**
 *
 * @param productCategory
 * @param header
 * @param eachLineData
 * @param user
 * @param done
 */
exports.findOrCreateProductBrand=function(productCategory, header, eachLineData, user, done) {
    var brandName = eachLineData.lineData[header.indexOf('BrandName')];
    var brandVariety = eachLineData.lineData[header.indexOf('BrandVariety')];
    // Right now Allowed user to create new Brand based on category ,brand name and variety .
            ProductBrand.findOne({name:brandName,variety:brandVariety,productCategory:productCategory._id},function (brandError,brand) {
        if (brandError) {
            importLogger.error(errorHandler.getErrorMessage(brandError));
            done(brandError);
        } else {
            if(brand) {
                /*  if (productCategory._id.toString() === brand.productCategory.toString()) {*/
                findOrAddProductBrandInCategory(productCategory._id, brand._id, function (productBrandInCategoryErr, productBrandInCategory) {
                    if (productBrandInCategoryErr) {
                        done(productBrandInCategoryErr, null);
                    } else if (productBrandInCategory) {
                        _this.findOrCreatePrimaryUOM(eachLineData,header, user, function (unitOfMeasureErr, unitOfMeasure) {
                            if (unitOfMeasureErr) {
                                done(unitOfMeasureErr, null);
                            } else {
                                findOrCreateAlternativeUOM(eachLineData,header, user, function (alternativeUnitOfMeasureErr, alternativeUnitOfMeasure) {
                                    if (alternativeUnitOfMeasureErr) {
                                        done(alternativeUnitOfMeasureErr, null);
                                    } else {
                                        updateProductBrandUOM(brand._id, productCategory._id, (unitOfMeasure ?unitOfMeasure._id:null),(alternativeUnitOfMeasure?alternativeUnitOfMeasure._id:null), function (updateError, uom) {
                                            if (updateError) {
                                                done(updateError, null);
                                            } else {
                                                ProductBrand.findById(brand._id, function (brandError, finalBrand) {
                                                    done(brandError, finalBrand);
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        done(new Error('Failed to update Brand at Product'), null);
                    }

                });
                /*}else{
                    importLogger.error('Add same Brand cant be added to multiple products');
                    done(new Error('Add same Brand cant be added to multiple products'));
                }*/
            }
            else{
                createProductBrand(productCategory, header, eachLineData, user, function (createProductBrandErr, productBrand) {
                    done(createProductBrandErr, productBrand);
                });
            }

        }

    });
};

function validHsnCodeTaxGroup(productBrand,taxGroup,hsnCode,done){
    if(!(taxGroup || hsnCode)){
        done(null,productBrand);
    }else if(!productBrand.taxGroup ||(productBrand.taxGroup && productBrand.taxGroup.name===taxGroup)){
        done(new Error('No matched Tax Group for the brand '+productBrand.name +' with the '+taxGroup),productBrand);
    }else if(! productBrand.hsncode ||(productBrand.hsncode && productBrand.hsncode.hsncode===taxGroup),productBrand) {
        done(new Error('No matched HsnCode for the brand ' + productBrand.name + ' with the ' + hsnCode),productBrand);
    }else{
        done(null,productBrand);
    }
}
/**
 *
 * @param data which will have main category,subcategory, header and eachLineData-{line data , rowLineData}
 * @param finalProducts
 * @param user
 * @param done
 */
exports.findByProductNames = function(categories,finalProducts,user,done){
    var datas=categories.categories;
    var businessUnit=categories.businessUnit;
    async.forEachSeries(datas,function(data,callbackSubCategory) {
        var index = datas.indexOf(data);
        var query = [{_id: data.subCategoryId, type: 'SubCategory1'}];
        var result={itemmasters: [], linedata: [], errorLineData: [], status: true};
        async.forEachSeries(data.value, function (eachLineData, callback) {
            _this.findOrCreateProductCategory(query, data.header, eachLineData, user, function (productCategoryErr, productCategory) {
                if (productCategoryErr) {
                    importLogger.error(errorHandler.getErrorMessage(productCategoryErr));
                    result.errorLineData.push({
                        data: eachLineData,
                        errorMessage: errorHandler.getErrorMessage(productCategoryErr)
                    });
                    result.status = false;
                    callback();
                } else {
                    // Create Product Brand and Item Master
                    _this.findOrCreateProductBrand(productCategory, data.header, eachLineData, user, function (productBrandErr, productBrand) {
                        if (productBrandErr) {
                            importLogger.error(errorHandler.getErrorMessage(productBrandErr));
                            result.errorLineData.push({
                                data: eachLineData,
                                errorMessage: errorHandler.getErrorMessage(productBrandErr)
                            });
                            result.status = false;
                            callback();
                        } else {
                            var hsnCode = eachLineData.lineData[data.header.indexOf('HsnCode')];
                            var taxGroup = eachLineData.lineData[data.header.indexOf('taxGroup')];
                            validHsnCodeTaxGroup(productBrand,hsnCode,taxGroup,function(errValidation) {
                                if(errValidation) {
                                    importLogger.error(errorHandler.getErrorMessage(errValidation));
                                    result.errorLineData.push({
                                        data: eachLineData,
                                        errorMessage: errorHandler.getErrorMessage(errValidation)
                                    });
                                    result.status = false;
                                    callback();
                                }else{
                                    _this.findOrCreateItemMaster(productBrand, data.header, eachLineData, user,businessUnit, function (itemMasterErr, itemMaster, warnings) {
                                        if (itemMasterErr) {
                                            importLogger.error(errorHandler.getErrorMessage(itemMasterErr));
                                            result.errorLineData.push({
                                                data: eachLineData,
                                                errorMessage: errorHandler.getErrorMessage(itemMasterErr)
                                            });
                                            result.status = false;
                                            callback();
                                            //callback(itemMasterErr);
                                        } else {
                                            result.itemmasters.push(itemMaster);
                                            result.linedata.push({
                                                srcLine: eachLineData.srcLine,
                                                isOld: eachLineData.nvipaniData,
                                                product: itemMaster._id,
                                                unitOfMeasure: itemMaster.unitOfMeasure,
                                                productBrandId: productBrand._id,
                                                productName: productCategory.name,
                                                brandName: productBrand.name,
                                                hsnCode: eachLineData.lineData[data.header.indexOf('HSNCode')]
                                            });
                                            if (warnings && warnings.length > 0) {
                                                warnings.forEach(function (warning) {
                                                    result.errorLineData.push({
                                                        data: eachLineData,
                                                        errorMessage: warning.message
                                                    });
                                                });
                                            }
                                            callback();

                                        }

                                    });
                                }
                            });

                        }
                    });

                }
            });


        }, function (errValue) {
            if (errValue) {
                //logger.error(errorHandler.getErrorMessage(err));
                importLogger.error(errorHandler.getErrorMessage(errValue));
                callbackSubCategory(errValue, null);
            } else {
                datas[index].value = result.linedata;
                datas[index].error = result.errorLineData;
                callbackSubCategory(null, datas[index]);
            }
        });
    },function (errCategory) {
        if(errCategory){
            done(errCategory,null);
        }else{
            done(null,datas);
        }
    });
};


exports.getOfferPaymentTerms=function(company,paymentTerms,companyPaymentTerms,applicablePaymentTerms,ispopulate,done){
    if(paymentTerms && paymentTerms.length>0){
        paymentTerms.forEach(function (eachPaymentTerm) {
            /* if(eachPaymentTerm.selected) {*/
            if (ispopulate) {
                applicablePaymentTerms.push(eachPaymentTerm.paymentTerm);
            } else {
                if ( eachPaymentTerm.selected || !eachPaymentTerm.paymentTerm) {
                    applicablePaymentTerms.push({
                        paymentTerm: eachPaymentTerm.paymentTerm ? eachPaymentTerm.paymentTerm : eachPaymentTerm,
                        selected: ( eachPaymentTerm.selected || !eachPaymentTerm.paymentTerm)
                    });
                }
            }
            /* }*/

        });
        done(null,applicablePaymentTerms);
    }else if(!companyPaymentTerms){
        Company.findById(company,'settings.paymentTerms').exec(function (companyError,companyData) {
            if(companyError){
                done(companyError,null);
            }else {
                if(companyData) {
                    if (ispopulate) {
                        Company.populate(companyData, {
                            path: 'settings.paymentTerms.paymentTerm', model: 'PaymentTerm', select: 'name'
                        }, function (err, dataCompany) {
                            companyPaymentTerms = [];
                            paymentTerms = dataCompany.settings.paymentTerms;
                            _this.getOfferPaymentTerms(company, paymentTerms, companyPaymentTerms, applicablePaymentTerms, ispopulate, function (err, paymentTerms) {
                                done(err, paymentTerms);
                            });
                        });
                    } else {
                        companyPaymentTerms = [];
                        if(companyData.settings) {
                            paymentTerms = companyData.settings.paymentTerms;
                            _this.getOfferPaymentTerms(company, paymentTerms, companyPaymentTerms, applicablePaymentTerms, ispopulate, function (err, paymentTerms) {
                                done(err, paymentTerms);
                            });
                        }else{
                            done(null,null);
                        }

                    }
                }else{
                    done(null,[]);
                }
            }
        });
    }else{
        done(null,[]);
    }
};
exports.getOfferPaymentModes=function(company,paymentModes,companyPaymentModes,applicablePaymentMode,ispopulate,done){
    if(paymentModes && paymentModes.length>0){
        paymentModes.forEach(function (eachPaymentMode) {

            if(eachPaymentMode.selected  || !eachPaymentMode.paymentMode) {
                if (ispopulate) {
                    applicablePaymentMode.push(eachPaymentMode.paymentMode);
                } else {
                    applicablePaymentMode.push({
                        paymentMode: eachPaymentMode.paymentMode ? eachPaymentMode.paymentMode : eachPaymentMode,
                        selected: (eachPaymentMode.selected || !eachPaymentMode.paymentMode)
                    });
                }
            }

        });
        done(null,applicablePaymentMode);
    }else if(!companyPaymentModes){
        Company.findById(company,'settings.paymentModes').exec(function (companyError,companyData) {
            if(companyError){
                done(companyError,null);
            }else {
                if(companyData) {
                    if (ispopulate) {
                        Company.populate(companyData, {
                            path: 'settings.paymentModes.paymentMode', model: 'PaymentMode', select: 'name'
                        }, function (errData, dataCompany) {
                            if (errData) {
                                done(errData, null);
                            } else {
                                paymentModes = dataCompany.settings.paymentModes;
                                _this.getOfferPaymentModes(company, paymentModes, companyPaymentModes, applicablePaymentMode, ispopulate, function (err, paymentsMode) {
                                    done(null, paymentsMode);
                                });
                            }
                        });
                    } else {
                        companyPaymentModes = [];
                        if (companyData.settings) {
                            paymentModes = companyData.settings.paymentModes;
                            _this.getOfferPaymentModes(company, paymentModes, companyPaymentModes, applicablePaymentMode, ispopulate, function (err, paymentsMode) {
                                done(null, paymentsMode);
                            });
                        } else {
                            done(null, null);
                        }
                    }
                }else{
                    done(null,null);
                }

            }
        });
    }else{
        done(null,[]);
    }
};
