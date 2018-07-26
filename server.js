'use strict';
/**
 * Module dependencies.
 */
//init = require('./config/init')(),
var config = require('./config/config'),
	mongoose = require('mongoose'),
	express = require('express'),

	chalk = require('chalk');

/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Bootstrap db connection
console.log(config.db);

var db = mongoose.connect(config.db, function(err) {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	}
});
//db.set('debug', true);
// Init the express application
console.log(db);

var app = require('./config/express')(db);

// Bootstrap passport configs
require('./config/passport')();

// require('./config/cron')(app);
// require('./config/dailycron')(app);

// Start the app by listening on <port>
// socket.io app.get('server').listen(config.port)
/*require('jsreport').bootstrapper().start();*/
/*app.listen(config.port);*/


/*var reportingApp = express();
app.use('/reporting', reportingApp);

require('jsreport').bootstrapper({
	express : {
		app : reportingApp
	}
}).start().then(function() {*/
	app.listen(config.port);
/*});*/

/*sreport.init().then(function() {*/
	//app.listen(config.port);
/*});*/


// Expose app
var exports = module.exports = app;
/*require('jsreport')({ httpPort: 3000, httpsPort: 0 }).init();*/

// Logging initialization
console.log('nVipani application started on port ' + config.port);
