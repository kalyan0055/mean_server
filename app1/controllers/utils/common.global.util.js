'use strict';
var mongoose = require('mongoose'),
    fs = require('fs');

/**
 * Module dependencies.
 */


function getDisplayName(object,done) {
    if((object.firstName && object.firstName.length>0 )||( object.lastName && object.lastName.length>0)||( object.middleName && object.middleName.length>0)){
        done(object.firstName + object.middleName + object.lastName);
    }else if(object.nVipaniRegContact){
        if(object.emails.length>0){
            done(object.emails[0].email);
        }else if(object.phones.length>0){
            done(object.phones[0].phoneNumber);
        }else{
            done('');
        }
    }else {
      done(object.username);
    }
}
exports.populateDisplayName=function(object,done){
    if(object.displayName && object.displayName.length>0){
        done(object.displayName);
    }else {
         getDisplayName(object,function(name) {
             done(name);
         }) ;
    }
};
exports.prepareOwnerByBusinessUnit=function (businessUnit) {
    var owner={};
    if(businessUnit){
        owner.company = businessUnit.company._id;
        owner.companyName = businessUnit.company.name;
        owner.companyCode = businessUnit.company.code;
        owner.businessUnitName = businessUnit.name;
        owner.businessUnitCode = businessUnit.code;
        owner.businessUnit = businessUnit._id;
       return owner;
    }else{
        return null;
    }

};

exports.leftPadWithZeros = function (number, length) {
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }

    return str;
};
exports.getIdByObject=function (field) {
    if(field){
        if(field instanceof Object){
          if(field.hasOwnProperty('_id')){
              return field._id.toString();
          }else{
              return field.toString();
          }
        }

    }else{
        return null;
    }
};

exports.toLocalTime = function(time) {
    var d = new Date(time);
    var offset = (new Date().getTimezoneOffset() / 60) * -1;
    var n = new Date(d.getTime() + offset);
    return n;
};
