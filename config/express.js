'use strict';

/**
 * Module dependencies.
 *
 * TODO: socket.io
 * socketio = require('socket.io'),
 */
var fs = require('fs'),
	http = require('http'),
	https = require('https'),
	express = require('express'),
 	cors = require('cors'),
	morgan = require('morgan'),
	bodyParser = require('body-parser'),
	session = require('express-session'),
	compress = require('compression'),
	/*logger= require('./logger'),*/
	methodOverride = require('method-override'),
	cookieParser = require('cookie-parser'),
	multer = require('multer'),
	helmet = require('helmet'),
	passport = require('passport'),
	mongoStore = require('connect-mongo')({
		session: session
	}),
	flash = require('connect-flash'),
	config = require('./config'),
	consolidate = require('consolidate'),
	path = require('path');

module.exports = function(db) {
	// Initialize express app
	console.log('express js files s');
	
	var app = express();
	app.use(cors())
	// Globbing model files
	config.getGlobbedFiles('./app/models/**/*.js').forEach(function(modelPath) {
		require(path.resolve(modelPath));
	});


	// Setting application local variables
	app.locals.title = config.app.title;
	app.locals.description = config.app.description;
	app.locals.keywords = config.app.keywords;
	app.locals.facebookAppId = config.facebook.clientID;
	// app.locals.jsFiles = config.getJavaScriptAssets();
	// app.locals.cssFiles = config.getCSSAssets();

	// Passing the request url to environment locals
	app.use(function(req, res, next) {
		res.locals.url = req.protocol + '://' + req.headers.host + req.url;
		console.log(res.locals.url);
		
        req.setTimeout(0);
		next();
	});

	// Should be placed before express.static
	app.use(compress({
		filter: function(req, res) {
			return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
		},
		level: 9
	}));

	// Showing stack errors
	app.set('showStackError', true);
	//   app.use(express.static(__dirname + '/public'));
	// app.use(express.static(path.join(__dirname, '/public')));
	// app.use(express.static(__dirname+'public'))
	//app.use('/public', express.static(__dirname + "/public"));
//  app.set('view engine', 'html');
 
	//Set swig as the template engine
	app.engine('server.view.html', consolidate[config.templateEngine]);

	//Set views path and view engine
	app.set('view engine', 'server.view.html');
	app.set('views', './app/views');

	// Initialize favicon middleware
	//app.use(favicon('./public/modules/core/img/brand/nvipani_favicon.ico'));
	// Environment dependent middleware
	if (process.env.NODE_ENV === 'development') {
		console.log('dev mode');
		
		/*app.use(morgan(logger.getFormat(), logger.getOptions()));*/
		// Enable logger (morgan)
		app.use(morgan('dev'));
		/*var logDirectory = __dirname + '/log';

// ensure log directory exists
		fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

// create a rotating write stream
		var accessLogStream = FileStreamRotator.getStream({
			filename: logDirectory + '/access-%DATE%.log',
			frequency: 'daily',
			verbose: false
		})

// setup the logger
		app.use(morgan('combined', {stream: accessLogStream}))*/


		// Disable views cache
		app.set('view cache', false);
	} else if (process.env.NODE_ENV === 'production') {
		app.locals.cache = 'memory';
	}

	// Request body parsing middleware should be above methodOverride
	app.use(bodyParser.urlencoded({limit: config.limit,
		extended: true
	}));
	app.use(bodyParser.json({limit: config.limit}));
	app.use(methodOverride());

	// CookieParser should be above session
	app.use(cookieParser());

	// Express MongoDB session storage
	/*app.use(session({
		saveUninitialized: true,
		resave: true,
		secret: config.sessionSecret,
		store: new mongoStore({
			db: db.connection.db,
			collection: config.sessionCollection
		})
	}));
*/

	/*var breadcrumbs = require('express-breadcrumbs');
	app.use(breadcrumbs.init());*/
	// use passport session
	app.use(passport.initialize());
	app.use(passport.session());
// Initialize Passport
// var initPassport = require('./../app/controllers/passport/passport');
// initPassport(passport);
	// connect flash for flash messages
	app.use(flash());
	// Add multipart handling middleware
	app.use(multer({dest:__dirname+'/uploads/',inMemory: true}).any());
	// Use helmet to secure Express headers
	app.use(helmet.frameguard());
	app.use(helmet.xssFilter());
	app.use(helmet.noSniff());
	app.use(helmet.ieNoOpen());
	app.disable('x-powered-by');

	// Setting the app router and static folder
	app.use(express.static(path.resolve('./public')));
 
	// Globbing routing files
	config.getGlobbedFiles('./app/routes/**/*.js').forEach(function(routePath) {
		require(path.resolve(routePath))(app);
	});

	// Assume 'not found' in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
	app.use(function(err, req, res, next) {
		// If the error object doesn't exists
		if (!err) return next();

		// Log it
		console.error(err.stack);

		// Error page
		res.status(500).render('500', {
			error: err.stack
		});
	});

	// Assume 404 since no middleware responded
	app.use(function(req, res) {
		res.status(404).render('404', {
			url: req.originalUrl,
			error: 'Not Found'
		});
	});

	if (process.env.NODE_ENV === 'secure') {
		// Log SSL usage
		console.log('Securely using https protocol');

		// Load SSL key and certificate
		var privateKey = fs.readFileSync('./config/sslcerts/key.pem', 'utf8');
		var certificate = fs.readFileSync('./config/sslcerts/cert.pem', 'utf8');

		// Create HTTPS Server
		var httpsServer = https.createServer({
			key: privateKey,
			cert: certificate
		}, app);

		// Return HTTPS server instance
		return httpsServer;
	}

	//TODO: socket.io
	/*var server = http.createServer(app);
	var io = socketio.listen(server);
	app.set('socketio', io);
	app.set('server', server);
	 */
	// Return Express server instance
	return app;
};
