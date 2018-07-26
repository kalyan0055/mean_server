'use strict';
var fs = require('fs');

/**
 * Module dependencies.
 */

/**
 * This method takes the array of moqVsPrice and quantity and returns the suitable price.
 * @param moqVsPrice
 * @param quantity
 * @returns {number|price}
 */
function getMinQuantityPrice(moqVsPrice,quantity) {
    var suitableMOQ;
    if(moqVsPrice!==undefined && moqVsPrice && moqVsPrice.length>=1) {
        //price = moqVsPrice[0].price;
        for (var i = 0; i < moqVsPrice.length; i++) {
            var moq = moqVsPrice[i].MOQ;
            if (moq <=quantity ) {
                suitableMOQ=  moqVsPrice[i];
            }
        }
    }
    return suitableMOQ;
}
exports.getQuantityPrice = function (moqVsPrice, quantity,orginalPrice) {
    if(moqVsPrice!==undefined && moqVsPrice && moqVsPrice.length>=1) {
        var suitableMOQ;
        var suitableMin =getMinQuantityPrice(moqVsPrice,quantity);
        var next = suitableMin;
        if(suitableMin) {
            if (suitableMin.MOQ === quantity) {
                return orginalPrice * (1 - (suitableMin.margin / 100));
            } else {
                for (var i = 0; i < moqVsPrice.length; i++) {
                    next = moqVsPrice[i];
                    if (suitableMin.MOQ <= next.MOQ && next.MOQ <= quantity) {
                        suitableMin = moqVsPrice[i];
                    }
                }
                return orginalPrice * (1 - (suitableMin.margin / 100));
            }
        }else{
            return orginalPrice;
        }
    }
    return orginalPrice;
};

function matchedMOQ(moqVsPrice,quantity,done) {
    var matchedMOQ=null;
    if(moqVsPrice && moqVsPrice instanceof Array && moqVsPrice.length>0) {
        for (var i = 0; i < moqVsPrice.length; i++) {
            var moq = moqVsPrice[i].MOQ;
            if (moqVsPrice[i].MOQ !== null && moqVsPrice[i].MOQ <= quantity && (!matchedMOQ || (matchedMOQ && moqVsPrice[i].MOQ  >=matchedMOQ.MOQ))) {
                matchedMOQ=moqVsPrice[i];
            }
        }
        done(matchedMOQ);
    }else{
        done(matchedMOQ);
    }

}
exports.getQuantityOrPrice=function(product,isBuy,quantity,isMargin){
    var moqVsPrice;
    if(isBuy) {
        moqVsPrice = product.moqAndBuyMargin;
    }else {
        moqVsPrice = product.moqAndMargin;
    }


    var finalQuality = Math.min.apply(null, moqVsPrice.map(function (o) {
        return o.MOQ;
    }));
    if(finalQuality>=quantity){
        quantity=finalQuality;
    }

    matchedMOQ(moqVsPrice,quantity,function (finalValue) {
        if(finalValue){
            if(isMargin){
                quantity=finalValue.margin;
            }else{
                quantity= finalValue.MOQ;
            }

        } else{
            if(isMargin){
                quantity=0;
            }else{
                quantity=product.numberOfUnits>0?0.00001:0;
            }

        }
    });


   return quantity;

};
exports.getMinQuantity=function(product,isBuy) {
    var moqVsPrice;
    if(isBuy)
        moqVsPrice=product.moqAndBuyMargin;
    else
        moqVsPrice=product.moqAndMargin;

    var quantity=moqVsPrice && moqVsPrice.length>0?(moqVsPrice[0].MOQ ?moqVsPrice[0].MOQ:(Math.max(product.numberOfUnits,product.maxUnits)>0?1:0)):(Math.max(product.numberOfUnits,product.maxUnits)>0?1:0);
    if(moqVsPrice && moqVsPrice instanceof Array && moqVsPrice.length>0) {
        for (var i = 0; i < moqVsPrice.length; i++) {
            var moq = moqVsPrice[i].MOQ;
            if (moqVsPrice[i].MOQ !== null && moqVsPrice[i].MOQ <= quantity) {
                quantity = moqVsPrice[i].MOQ;
            }
        }
    }
    return quantity;
};
exports.getMinMOQ=function(product,isBuy) {
    var moqVsPrice;
    if(isBuy)
        moqVsPrice=product.moqAndBuyMargin;
    else
        moqVsPrice=product.moqAndMargin;

    if(!moqVsPrice||(moqVsPrice &&moqVsPrice.length===0)){
        return {MOQ:(product.numberOfUnits>0?1:0),margin:0};
    }else {
        var quantity = Math.min.apply(null, moqVsPrice.map(function (o) {
            return o.MOQ;
        }));

        return getMinQuantityPrice(moqVsPrice,quantity);
    }
};
exports.isFileAccessible = function(file){
    try {

        var fullpath ='../../../'+file;

        var path=require('path');
        var finalpath = path.resolve(file);
        return fs.statSync(finalpath).isFile();
    } catch (e) {
        console.log('file statsync:'+e.message);
        return false;
    }
};
exports.isDirectoryAccessible = function(file){
    try {

        var fullpath ='../../../'+file;

        var path=require('path');
        var finalpath = path.resolve(path.join(__dirname,fullpath));
        console.log('file statsync:'+finalpath);
        console.log('CWD:'+fs.cwd);
        return fs.statSync(finalpath).isDirectory();
    } catch (e) {
        console.log('file statsync:'+e.message);
        return false;
    }
};
/**
 * used to check if the image is default image.
 * if is default image, then it can be replaced with
 * a new image from import
 * @param file
 * @param type
 * @returns {boolean}
 */
exports.isDefaultImage = function(file,type){
    return file==='modules/'+type+'/img/profile/default.png';
};

/**
 * If the path starts with /public/, then it
 * should be removed to be displayed in ui
 * for the sake of url mapping.
 * @param imagePath
 * @returns {*}
 */
exports.mapImageURL = function(imagePath){
    /*if(imagePath) {*/
    if (imagePath.startsWith('./public/')) {
        return imagePath.replace('./public/', '');
    }
    else if (imagePath.startsWith('/public/')) {
        return imagePath.replace('/public', '');
    } else if (imagePath.includes('/public/')) {
        var imagePathArray = imagePath.split('/public/');
        return imagePathArray.length > 1 ? imagePathArray[1] : imagePath;
    }
    /*}*/
    return imagePath;
};




