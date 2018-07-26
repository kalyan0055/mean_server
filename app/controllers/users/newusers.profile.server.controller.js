'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
    errorHandler = require('../errors.server.controller.js'),
    mongoose = require('mongoose'),
    fs = require('fs'),
    logger  = require('../../../lib/log').getLogger('USERS', 'DEBUG'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    usersJWTUtil   = require('../utils/users.jwtutil'),
   // businessUnitUtil =require('../utils/common.businessunit.util'),
    dbUtil = require('../utils/common.db.util'),
    User = mongoose.model('User'),
    NewUser = mongoose.model('Newuser'),
    newuserJWTUtil = require('../utils/newusers.jwtutil'),
    async = require('async');
   
    // User = require('../models/user');
    // bCrypt = require('bcrypt-nodejs');;
     
	
  
/**
 * Update user details
 */
exports.newregister = function(req, res) {
    // Init Variables
    console.log(req.body,'sended data');
    
    var message = null;
    const user = new NewUser({
       username : req.body.username,
       mobile : req.body.mobile,
       password : req.body.password,
       email : req.body.email,
       salt : req.body.password,
    })
 
    user.save(function(err,res2){
        console.log(err,res2);
        if(err){
            res.json({success:false,data:err})
        }
        res.json({success:true,data:'success'})
    });  
};

exports.newuserslist =  function(req, res) {
    // Init Variables
    console.log(req.body,'sended data');
    
    NewUser.find({},'username mobile email status',function(err,res2){  
        if(res2){
            res.json({success:true,data:res2})
        }else{
            res.json({success:false,data:''})
        }
        
    });  

  
// NewUser.find({}, function (errContact, contact) {
//     console.log(errContact,'error related');
//     console.log(contact,'contactt');

    
//     if (errContact) {
//         logger.error('Error while loading the contact for the registration user id  after saving the company details with Company name ' );
//         return res.status(400).json({
//             message: errorHandler.getErrorMessage(errContact)
//         });
//     }

//     if (contact) {
//         res.json({contactExists: contact});
//     }else{
//         res.json({contactExists: contact});
//     }
// });
};

exports.updateuser = async function(req, res){

   await newuserJWTUtil.findUserByToken(req.body,function(err,result){
        console.log(result.mobile,result.email,'tttt');
        
        NewUser.update({_id:result._id},{$set:{username:req.body.username,mobile:req.body.mobile,email:req.body.email}},
        function(err,update) {
            console.log(update,'returned form util & update');
            
        if(err){
            res.json({success:false,data:err})
        }  
        if(!update){
            res.json({success:false,data:update})
        }
        if(update){
            res.json({success:true,data:'success'})
        }         
        })
    })
};


exports.login =  function(req, res,next){
   console.log('hello',req.body);
   
        passport.authenticate('local', function(err,user,info) { 
            console.log(err,user);
            
                // check in mongo if a user with username exists or not
                if (err || !user) {
                    info.status = false;
                    logger.error('Error Signin with username -' + req.body.username + ', -' + JSON.stringify(info));
                    //logger.debug('Error Message-'+JSON.stringify(info));
                    res.status(400).send(info);
                }else{
                    NewUser.findOne({ 'username' :  user.username }, 
                    function(err, user) {
                        // In case of any error, return using the done method
                        if (err)
                        res.json({success:false,token:'',data:err})
                        // Username does not exist, log the error and redirect back
                        if (!user){
                            console.log('User Not Found with username '+username);
                            res.json({success:false,token:'token',data:err})               
                        }
                        if(user){
                            var token = usersJWTUtil.genToken(user.username, user._id);
                            res.json({success:true,token:token,data:user})
                        }
                        // User exists but wrong password, log the error 
                        // if (!isValidPassword(user, password)){
                        //     console.log('Invalid Password');
                        //     return done(null, false, req.flash('message', 'Invalid Password')); // redirect back to login page
                        // }
                        // User and password both match, return user from done method
                        // which will be treated like success
                         
                    }
                );
                }   
            })(req,res,next)

        // var isValidPassword = function(user, password){
        //     return bCrypt.compareSync(password, user.password);
        // }
        
   
 };
 exports.signin = function (req, res, next) {

     console.log('Request Body-'+JSON.stringify(req.body));
     logger.debug('Request Body-'+JSON.stringify(req.body));
    passport.authenticate('local', function (err, user, info) {
        if (err || !user) {
            info.status = false;
            logger.error('Error Signin with username -' + req.body.username + ', -' + JSON.stringify(info));
            //logger.debug('Error Message-'+JSON.stringify(info));
            res.status(400).send(info);
        } else {
            User.findOne({
                username: user.username
            }).select('-salt -password').populate('company', 'category segments registrationCategory').exec(function (err, dbuser) {
                if (dbuser) {
                    var devicename;
                    var devicedescription;
                    var devicetoken;
                    var location;
                    var ipaddress;
                    var deviceid;
                    var appversion;
                    if (req.body.devicename) {
                        devicename = req.body.devicename;
                    }
                    if (req.body.appversion) {
                        appversion = req.body.appversion;
                    }

                    if (req.body.deviceid) {
                        deviceid = req.body.deviceid;
                    }
                    if (req.body.devicedescription) {
                        devicedescription = req.body.devicedescription;
                    }
                    if (req.body.devicetoken) {
                        devicetoken = req.body.devicetoken;
                    }

                    if (req.body.location) {
                        location = req.body.location;
                    }

                    if (req.body.ipaddress) {
                        ipaddress = req.body.ipaddress;
                    }

                    if (!dbuser.devices) {
                        dbuser.devices = [];
                    }
                    if (deviceid && devicetoken && dbuser.devices.filter(function (device) {
                            return device.deviceid === deviceid;
                        }).length === 0) {
                        dbuser.devices.push({
                            deviceid: deviceid,
                            name: devicename,
                            description: devicedescription,
                            token: devicetoken,
                            appversion: appversion
                        });
                    }

                    if (!dbuser.accountActivity) {
                        dbuser.accountActivity = [];
                    }
                    if (deviceid) {
                        dbuser.accountActivity.push({
                            deviceid: deviceid,
                            accessType: devicename + '(' + devicedescription + ')',
                            location: location,
                            ipAddress: ipaddress,
                            loginTime: Date.now(),
                            appversion: appversion
                        });
                    }
                    dbuser.updated = Date.now();
                    dbuser.save(function (err, resultUser) {
                        if (err) {
                            logger.error('Error updating the user with username -' + req.body.username);
                            //logger.debug('Error Message-'+JSON.stringify(info));
                            res.status(400).send({
                                status: false,
                                message: 'Error updating the user with username -' + req.body.username
                            });
                        } else {
                            var token = usersJWTUtil.genToken(resultUser.username, resultUser.id);

                            //logger.debug('token-'+token);
                            if (resultUser.company.segments.length === 0) {
                                RegistrationCategory.findById(resultUser.company.registrationCategory).exec(function (registrationCErr, registrationCategory) {
                                    if (registrationCErr) {
                                        res.status(400).send({
                                            status: false,
                                            message: registrationCErr.getMessage()
                                        });
                                    } else {
                                        BusinessSegments.find().populate('categories.category').exec(function (businessErr, businessSegments) {
                                            companyUtil.findCompanyEmployeeBusinessUnits(user,function (userBusinessUnitsError,userBusinessUnits) {
                                                if(userBusinessUnitsError){
                                                    res.status(400).send({
                                                        status: false,
                                                        message: errorHandler.getErrorMessage(userBusinessUnitsError)
                                                    });
                                                }else {
                                                    res.json({
                                                        status: true,
                                                        token: token,
                                                        businessUnits: userBusinessUnits,
                                                        companySegments: resultUser.company.segments,
                                                        categories: resultUser.company.categories,
                                                        segments: businessSegments,
                                                        registrationCategory: registrationCategory
                                                    });
                                                }
                                            });
                                        });
                                    }


                                });
                            } else {
                                companyUtil.findCompanyEmployeeBusinessUnits(user,logger,function (userBusinessUnitsError,userBusinessUnits) {
                                    if (userBusinessUnitsError) {
                                        res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(userBusinessUnitsError)
                                        });
                                    } else {
                                        res.json({
                                            status: true,
                                            token: token,
                                            businessUnits: userBusinessUnits,
                                            companySegments: resultUser.company.segments,
                                            categories: resultUser.company.category
                                        });
                                    }
                                });
                            }
                        }
                    });
                } else {
                    res.status(400).send({
                        status: false,
                        message: 'Error finding the user with username -' + user.username
                    });
                }
            });


            // Remove sensitive data before login
            /*user.password = undefined;
             user.salt = undefined;

             req.login(user, function(err) {
             if (err) {
             res.status(400).send(err);
             } else {
             res.json({token:genToken(user.username, user.id)});
             }
             });*/
        }
    })(req, res, next);
};
exports.deleteuser =  function(req, res){

     NewUser.deleteOne({ _id: req.body._id }, function (err, user) {
             if(err){
                res.json({success:false,data:'Unable to Delete'})
             }
             res.json({success:true,data:'Deleted Successfully'})
          });
 }


/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
    var token = req.body.token || req.headers.token;
    if (token) {
        logger.debug('Profile Picture [name:' + req.files.file.name + ', fieldname:' + req.files.file.fieldname + ', originalname:' + req.files.file.originalname + ']');
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (user) {
                fs.writeFile('./public/modules/users/img/profile/uploads/' + req.files.file.name, req.files.file.buffer, function (uploadError) {
                    if (uploadError) {
                        return res.status(400).send({
                            status: false,
                            message: 'Error occurred while uploading profile picture'
                        });
                    } else {
                        User.findOne({
                            username: user.username
                        }, '-salt -password', function (err, dbuser) {
                            if (dbuser) {
                                dbuser.profileImageURL = 'modules/users/img/profile/uploads/' + req.files.file.name;

                                dbuser.save(function (saveError) {
                                    if (saveError) {
                                        return res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(saveError)
                                        });
                                    } else {
                                        res.json({
                                            status: true,
                                            token: usersJWTUtil.genToken(dbuser.username, dbuser.id),
                                            user: dbuser
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.status(400).send({
                    status: false,
                    message: 'User is not signed in'
                });
            }
        });
    } else {
        res.status(400).send({
            status: false,
            message: 'User is not signed in'
        });
    }
};


