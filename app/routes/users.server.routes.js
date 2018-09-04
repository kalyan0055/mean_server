'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport');
var swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('../../dist/api-docs.json');
var express = require('express');
var router = express.Router();
module.exports = function(app) {
	// User Routes
	var users = require('../../app/controllers/users.server.controller'),
	 fileupload = require('../../app/controllers/utils/fileupload.util');
	 
	var test;
	 app.use(function (req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		var regexp = new RegExp('/api/v1/');
		test = regexp.test(res.locals.url);
		console.log(test,'testing');
		
		req.setTimeout(0);
		next();
	});

	//if(test){
		console.log('if part');
		
		router.route('/users/newuserslist/:userid').get(users.newuserslist);
		router.route('/user/sendpresignupotp').post(users.userRegistration);
		router.route('/user/verifypresignupotp').post(users.userRegistration);
		app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
		app.use('/api/v1', router);
	// }else{
	// 	console.log('else part');
	 
	 app.route('/users/newuserslist/:userid').get(users.newuserslist);

	// Setting up the users profile apis -- Practise 
 
	// app.route('/users/newuserslist/:userid').get(users.newuserslist);
	app.route('/users/updateuser').post(users.updateuser);
	//app.route('/users/login').post(users.login);
	app.route('/users/deleteuser').post(users.deleteuser);
 

	
	app.route('/users/registervialink').post(users.registervialink);
	app.route('/users/sendPasswordLink').post(users.sendPasswordLink);
	app.route('/users/disableUser').post(users.disableUser);

	


	
	app.route('/users/me').post(users.me);
	app.route('/users/myhome').get(users.requiresLogin, users.myhome);
	app.route('/users/profilePicture').post(users.changeProfilePicture);
	app.route('/users').put(users.update);
	app.route('/users/accounts').delete(users.removeOAuthProvider);
	app.route('/fileupload').post(fileupload.fileUploadPath);
	// Setting up the users password api
	app.route('/users/password').post(users.changePassword);
    app.route('/fileimport').post(fileupload.fileImportPath);
    app.route('/fileexport').get(fileupload.fileExportPath);
	app.route('/auth/forgot').post(users.forgot);
    app.route('/user/otp/:statusToken').post(users.validateOTPAcceptRegisterToken);
	app.route('/user/otpuser').post(users.validateOTPAcceptRegisterToken);

	app.route('/user/otpuserpassword').post(users.forgotPasswordWithOtp);
    app.route('/user/resendotp/:statusToken').post(users.resendOTP);
	app.route('/user/resendotpuser').post(users.resendOTP);
	app.route('/auth/reset/:token').get(users.validateResetToken);
	//app.route('/auth/reset/:token').post(users.reset);
	app.route('/auth/reset').post(users.reset);

	// Setting up the users authentication api
	app.route('/user/presignup').post(users.presignup);
    app.route('/user/sendpresignupotp').post(users.userRegistration);
	app.route('/signup/:registerToken').get(users.findByUserStatusToken);

	app.route('/userregister/:registerToken').get(users.findByUserStatusToken);
	//app.route('/user/register/:registerToken').post(users.signup);

	//app.route('/auth/register/:registerToken').get(users.validateRegisterToken);
	//app.route('/auth/register/:token').post(users.signup);

/*

	app.route('/auth/register/:registerToken')
		.get(users.validateRegisterToken)
		.put(users.update);
*/


	/*app.route('/auth/signup/:token').post(users.join);*/
	app.route('/auth/signin').post(users.signin);
	app.route('/auth/signout').get(users.signout);
    app.route('/auth/updatedevicetoken').post(users.updateDeviceToken);
	app.route('/auth/signup').post(users.signup);

	// Setting the facebook oauth routes
	app.route('/auth/facebook').get(passport.authenticate('facebook', {
		scope: ['email']
	}));
	app.route('/auth/facebook/callback').get(users.oauthCallback('facebook'));

	// Setting the twitter oauth routes
	app.route('/auth/twitter').get(passport.authenticate('twitter'));
	app.route('/auth/twitter/callback').get(users.oauthCallback('twitter'));

	// Setting the google oauth routes
	app.route('/auth/google').get(passport.authenticate('google', {
		scope: [
			'https://www.googleapis.com/auth/userinfo.profile',
			'https://www.googleapis.com/auth/userinfo.email'
		]
	}));
	app.route('/auth/google/callback').get(users.oauthCallback('google'));

	// Setting the linkedin oauth routes
	app.route('/auth/linkedin').get(passport.authenticate('linkedin'));
	app.route('/auth/linkedin/callback').get(users.oauthCallback('linkedin'));

	// Setting the github oauth routes
	app.route('/auth/github').get(passport.authenticate('github'));
	app.route('/auth/github/callback').get(users.oauthCallback('github'));

    app.route('/auth/adduser').post(users.addBusinessUser);
    app.route('/auth/updateuser').put(users.updateBusinessUser);
    app.route('/auth/activeUser').post(users.getRegisterRequestBusinessUser)
		.get(users.getRegisterRequestBusinessUser);
    app.route('/auth/activateUser/:statusToken').post(users.activateBusinessUser);
    app.route('/auth/companyUserMassActions').post(users.massActionsOnCompanyEmployees);
    app.route('/auth/businessUnitMassActions').post(users.massActionsOnUnitEmployees);
	app.route('/auth/userGroups').get(users.listUserGroups);
	app.route('/auth/employeeDetailsForActivate/:statusToken').get(users.getEmployeeDetailsForActivate);
	app.route('/auth/addMassUsersToUnit').post(users.addMassEmployeesToBusinessUnit);

	// Finish by binding the user middleware
	app.param('userId', users.userByID);
//}
};
