'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    mongoose = require('mongoose'),
    errorHandler = require('../controllers/errors.server.controller'),
    usersJWTUtil = require('../controllers/utils/users.jwtutil'),
    logger = require('../../lib/log').getLogger('USERS', 'DEBUG'),
    config = require('../../config/config'),
    Settings = mongoose.model('Settings');

function hasAuthorization(token, done) {
        var token = token;
          usersJWTUtil.findUserByToken(token, function (err, user) {
            if (err) {
                done(new Error('User is not authorized'), false, false);
            } else {
                if(user.userType == config.authType || user.userType == config.authType1){
                    done(null,user)
                }else{
                     done(new Error('User is not authorized'), false, false);  
                }
                
            }
        });
    
    }

exports.insertSettings = function (req, res) {
    var settings = (req.body);
    var usertoken = req.body.token || req.headers.token;  
    console.log(usertoken,'ata cntroller');
    
    hasAuthorization(usertoken,function(err,result){
        if(err){
            return res.status(400).send({
                status: false,
                message: 'User is not Authorized'
            });
        }else{
            if (settings._id) {
                Settings.update({ _id: settings._id }, { ui_table: settings.ui_table, records_per_page: settings.records_per_page }, function (err, UpdateSetting) {
                    if (err) {
                        return res.json({ status: false, message: errorHandler.getErrorMessage(err) });
        
                    } else {
                        return res.json({ status: true, message: 'Data Updated Successfully', data: UpdateSetting });
                    }
                })
            } else {
               Settings.insertMany([settings],function (err, SettingsSave) {
                    if (err) {
                        return res.json({ status: false, message: errorHandler.getErrorMessage(err) });
        
                    } else {
                        return res.json({ status: true, message: 'Data Saved Successfully', data: SettingsSave });
                    }
        
                })
            }
        }
   

})
},
    exports.getSettings = function (req, res) {
        Settings.find({}, function (err, Stngs) {
            if (err) {
                return res.status(400).send({
                    status: false,
                    data: Stngs,
                    message: errorHandler.getErrorMessage(err)
                })
            }
            return res.status(200).json({
                status: true,
                data: Stngs,
                message: 'List of Settings'
            })
        });

    },
    exports.getSettings_ajax = function (req, res) {
        console.log('getSettings_ajax',req.body);
        var fields = req.body.columns[req.body.order[0].column].name;
        var sortBy = (req.body.order[0].dir == 'asc') ? 1 : -1;
        let obj = {};
        obj[`${fields}`] = sortBy
        console.log(req.body.search.value.toLowerCase(), 'dsfsdf');
        Settings.find({}).skip(req.body.start).limit(req.body.length).sort(obj).exec(async function (err, Stngs) {
            if (err) {
                return res.status(400).send({
                    status: false,
                    data: Stngs,
                    message: errorHandler.getErrorMessage(err)
                })
            }else{
                if (req.body.search.value != '' || req.body.search.value != null) {
                    var searchitem = '';
                    searchitem = req.body.search.value.toLowerCase()
                }
                var serchdata = [];
                serchdata = Stngs.filter(function (item) {
                    return JSON.stringify(item).toLowerCase().includes(searchitem);
                });
            }
            const tot_count = await Settings.count();
            return res.status(200).json({
                status: true,
                data: (!searchitem) ? Stngs : serchdata,
                tot_count:tot_count,
               })
        });

    },
    exports.deleteSettingById = function (req, res) {
        var usertoken = req.body.token || req.headers.token;  
        hasAuthorization(usertoken,function(err,result){
            if(err){
                return res.status(400).send({
                    status: false,
                    message: 'User is not Authorized'
                });
            }else{
         Settings.updateOne({_id:req.params.id},{$set:{deleted:true}}, function (err, Stngs) {
            console.log(Stngs, 'data');

            if (err) {
                return res.json({
                    status: false,
                    data: Stngs,
                    message: errorHandler.getErrorMessage(err)
                })
            }
            return res.json({
                status: true,
                data: Stngs,
                message: 'Deleted Successfully'
            })
        });
    }})
    }