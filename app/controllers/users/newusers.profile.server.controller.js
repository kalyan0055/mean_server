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
    // User = mongoose.model('User'),
    User = mongoose.model('Newuser'),
    newuserJWTUtil = require('../utils/newusers.jwtutil'),
    async = require('async'),
    config = require('../../../config/config'),
    
    nodemailer = require('nodemailer');
    // User = require('../models/user');
    // bCrypt = require('bcrypt-nodejs');;
     
	
  
/**
 * Update user details
 */
 

exports.newuserslist =  function(req, res) {
    // Init Variables
    console.log(req.params.userid,'sended data');
    // User.find().populate('created_by',null,{username:'demoadmin@nvipani.com'}).exec(function(err,res2){  
    //     console.log(err);
    //     console.log(res2);
   //  User.populate('created_by','firstName',{'username':'demoadmin@nvipani.com'}).exec(function(err,res2){   
        
    //     if(res2){
    //         res.json({success:true,data:res2})
    //     }else{
    //         res.json({success:false,data:''})
    //     }
     
    // })
    newuserJWTUtil.findUserById(req.params.userid,function(err,result){
        if(err || !result){
            res.status(400).send({
                status:false,
                message: errorHandler.getErrorMessage(err),
                data:null
            })
        }else{
            let query ={};
           (result.userType==='Admin')?query={}:query={'created_by':req.params.userid}
           console.log(query);
           
            User.find(query).populate('created_by','username').exec(function(err, users) {
                if (err) { res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err),
                    data:null
                }); }
                else if (!users) {  res.status(401).send({
                    status: false,
                    message: 'No Data Found',
                    data:null
                })}
                else{
                    res.status(200).send({
                        status: true,
                        message: 'List of Users by Id',
                        data:users
                    });;
                }    
            });
        } 
})
};

 
function getEmailTemplate(user,type,req) {
    console.log(req.protocol + '://' + req.headers.host);
   
     
    let a ='';
    a= new Buffer(user).toString('base64');
     
    if(type==='Registered') {
        return {template:'templates/success-user',subject:'You are successfully Activated',options: {
                name: 'Customer',
                appName: config.app.title,
                otp: user.emailOtp,
                baseUrl: req.protocol + '://' + req.headers.host,
                username: user.username
            }};
    }else if(type==='Register Request'){
        return {template:'templates/user-registration',subject:'Registration Request',options: {
                name: 'Customer',
                appName:'Technical',
                otp: '125463',
                hyperlink: req.protocol + '://' + 'localhost:4200/confirm/true/'+a,
                baseUrl: req.protocol + '://' + req.headers.host,
                username: user
            }};
    }else{
        return {template:'templates/user-registration',subject:'Activated',options:{}};
    }
}
exports.registervialink = function(req,res,done){

    console.log(req.body.username,'resssdfsf'); 
    var emailTemplate= getEmailTemplate(req.body.username,'Register Request',req);
    
    
        res.render(emailTemplate.template, emailTemplate.options, function (err, emailHTML) {
            console.log(err);
            
        var smtpTransport = nodemailer.createTransport(config.mailer.options);
        var mailOptions = {
            to: 'rambabu.e@technoxis.in',
            from: config.mailer.from,
            subject: emailTemplate.subject,
            html: emailHTML
        };
        // if (config.production) {
        //     mailOptions.bcc = config.nvipaniAdminUsers;
        // }
        logger.debug('Sending OTP Response-' );
        smtpTransport.sendMail(mailOptions, function (err) {
            if (err) {
                /*res.status(400).send({
                    status: false,
                    message: errorHandler.getErrorMessage(err)
                });*/
                done(err, null);
            }
            if (!err) {
                res.json({
                    success:true,
                    data:req.body.username
                })
            }

        });
    })
  
}

exports.disableUser = function (req,res){
    let data= req.body;
    newuserJWTUtil.findUserById(data.id,function(err,user){
    if(err || !user){
        logger.error('Something went wrong with -' + req.body.id + ', -' + JSON.stringify(data));
        logger.debug('Error Message-'+JSON.stringify(data));
        res.status(400).send({status:false,message:errorHandler.getErrorMessage(err)});
    }else{
        let types =['enable','disable'];
        if(!types.includes(data.type)){
            return res.status(400).send({
                status: false,
                message: `Invalid type ${data.type} - it should be enable or disable`
            });
        }
        let type = '';
        (data.type ==='disable')?type=true:type=false;

        User.updateOne({_id:data.id},{$set:{disabled:type}},function(err,result){
        console.log(result);
        if(err){
                return res.json({
                        status:false,
                        message:'Unable to Disable User'
                    })
                }else{
                    return res.json({
                        status:true,
                        message:`User Successfully ${data.type}`
                    })
                }
            })
        }
    })
}
 
 
 exports.signin = function (req, res, next) {

    console.log('Request Body-'+JSON.stringify(req.body));
    logger.debug('Request Body-'+JSON.stringify(req.body));
    passport.authenticate('local', function (err, user, info) {
    console.log(user.username,'after passport');
    
        if (err || !user) {
            console.log('it is come else part');
  
            info.status = false;
            logger.error('Error Signin with username -' + req.body.username + ', -' + JSON.stringify(info));
            //logger.debug('Error Message-'+JSON.stringify(info));
            res.status(400).send(info);
        } else {
            User.findOne({
                username: user.username
            }).select('-salt -password').populate('company', 'category segments registrationCategory').exec(function (err, dbuser) {
               console.log(dbuser,'query executed');
               
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
    let data= req.params.userid;
    newuserJWTUtil.findUserById(data,function(err,user){
        if(err || !user){
            logger.error('Something went wrong with -' + data + ', -' + JSON.stringify(err));
            logger.debug('Error Message-'+JSON.stringify(err));
            res.status(400).send({
                status: false,
                message: 'Error deleting the user with user id -' + data
            });
        }else{
            if(user){
                User.updateOne({_id:user._id},{$set:{deleted:true}},function(err,result){                      
                    if(err || !result){
                        res.json({
                            status:false,
                            message:'Unable to Delete'
                        })
                    }else{
                        res.json({
                            status:true,
                            message:'User Successfully Deleted',
                           })  
                    }
                })
            }
        }
    })
 };


/**
 * Update profile picture
 */
exports.changeProfilePicture = function (req, res) {
    console.log(req.files,'ttttttttttttttttttttttt');
    
    var token = req.body.token || req.headers.token;
    if (token) {
        logger.debug('Profile Picture [name:' + req.files[0].filename + ', fieldname:' + req.files[0].fieldname + ', originalname:' + req.files[0].originalname + ']');
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (user) {
                // fs.writeFile('./public/modules/users/img/profile/uploads/' + req.files[0].filename, req.body.buffer, function (uploadError) {
                //     if (uploadError) {
                //         return res.status(400).send({
                //             status: false,
                //             message: 'Error occurred while uploading profile picture'
                //         });
                //     } 
                console.log(user.profileImageURL);
                
                var exist_image = './public/'+user.profileImageURL;
                var path = './public/modules/users/img/profile/uploads/' + req.files[0].filename;
                logger.debug('path:' + './public/modules/users/img/profile/uploads/' + req.files[0].filename);

                fs.rename( req.files[0].path,path, function (uploadError) {
                    if (uploadError || ! req.files[0].mimetype) {
                        return res.status(400).send({
                            message: 'Error occurred while uploading file at ' + req.headers.uploadpath
                        });
                    }                   
                    else {
                        User.findOne({
                            username: user.username
                        }, '-salt -password', function (err, dbuser) {
                            if (dbuser) {
                                dbuser.profileImageURL = 'modules/users/img/profile/uploads/' + req.files[0].filename;

                                dbuser.save(function (saveError) {
                                    if (saveError) {
                                        return res.status(400).send({
                                            status: false,
                                            message: errorHandler.getErrorMessage(saveError)
                                        });
                                    } else {
                                        fs.unlink(exist_image,function(err,result){
                                            if(err){
                                                return res.status(400).send({
                                                    status: false,
                                                    message: errorHandler.getErrorMessage(err)
                                                });
                                            }else{
                                                res.json({
                                                    status: true,
                                                    token: usersJWTUtil.genToken(dbuser.username, dbuser.id),
                                                    user: dbuser,
                                                    path: req.files[0].filename
                                                });
                                            }
                                        })
                                       
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


