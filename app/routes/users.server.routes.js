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
	var users = require('../../app/controllers/internaluser.server.controller'),
	 fileupload = require('../../app/controllers/utils/fileupload.util');
	 
	var test;
	 app.use(function (req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		var regexp = new RegExp('/api/v1/');
		test = regexp.test(res.locals.url);
	 
		req.setTimeout(0);
		next();
	});

	//if(test){
	 //SWAGGER APIS
		
		router.route('/users/newuserslist/:userid').post(users.newuserslist);
		router.route('/user/userRegistration').post(users.userRegistration);
		router.route('/user/verifypresignupotp').post(users.userRegistration);
		router.route('/users/deleteuser/:userid').delete(users.deleteuser);
		router.route('/users/update').put(users.update);
		router.route('/users/disableOrEnableUser').post(users.disableUser);
		router.route('/users/resetPasswordRequest').post(users.resetPasswordRequest);
		router.route('/users/setPassword').post(users.reset);
		app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
		app.use('/api/v1', router);
	 //END SWAGGER APIS
		
	app.route('/user/userRegistration').post(users.userRegistration);
	app.route('/users/newuserslist/:userid').post(users.newuserslist);
	app.route('/users/deleteuser/:userid').delete(users.deleteuser); 
	app.route('/users/restoreeuser/:userid').delete(users.restoreeuser);
 	app.route('/users/registervialink').post(users.registervialink);
	app.route('/users/resetPasswordRequest').post(users.resetPasswordRequest);
	app.route('/users/disableUser').post(users.disableUser);
	app.route('/users/profilePicture').post(users.changeProfilePicture);
	app.route('/users/update').put(users.update);
	app.route('/auth/reset').post(users.reset);
	app.route('/users/finduser').post(users.findUser);
	app.route('/fileupload').post(fileupload.fileUploadPath);
	app.route('/auth/signin').post(users.signin);

};
