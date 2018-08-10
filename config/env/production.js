'use strict';

module.exports = {
	port: process.env.PORT || 80,
    production: true,
    sendNotification:true,
    sendSMS:true,
    sendEmail:true,
/*	log: {
		// logging with Morgan - https://github.com/expressjs/morgan
		// Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
		format: process.env.LOG_FORMAT || 'combined',
		options: {
			// Stream defaults to process.stdout
			// Uncomment/comment to toggle the logging to a log on the file system
			stream: {
				directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
				fileName: process.env.LOG_FILE || 'access.log',
				rotatingLogs: { // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
					active: process.env.LOG_ROTATING_ACTIVE === 'true' ? true : false, // activate to use rotating logs
					fileName: process.env.LOG_ROTATING_FILE || 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
					frequency: process.env.LOG_ROTATING_FREQUENCY || 'daily',
					verbose: process.env.LOG_ROTATING_VERBOSE === 'true' ? true : false
				}
			}
		}
	},*/
	db: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/nvipani',
	assets: {
		lib: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.min.css',
				'public/lib/bootstrap/dist/css/bootstrap.css',
				'public/lib/bootstrap/dist/css/bootstrap-theme.css',
				'public/lib/angular-xeditable/dist/css/xeditable.css',
				'public/lib/flexslider/flexslider.css',
				'public/lib/select2/select2.css',
				'public/lib/select2/select2-bootstrap.css',
				'public/lib/font-awesome/css/font-awesome.min.css',
				'public/lib/angualar-wizard/dist/angular-wizard.min.css',
				'public/lib/angular-ui-notification/dist/angular-wizard.min.css',
				'public/lib/angular-material/angular-material.min.css',
				'public/lib/flexslider/flexslider.css'
			],
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/bootstrap/dist/js/bootstrap.min.js',
				'public/lib/angular/angular.min.js',
				'public/lib/angular-resource/angular-resource.js', 
				'public/lib/angular-cookies/angular-cookies.js', 
				'public/lib/angular-animate/angular-animate.js', 
				'public/lib/angular-touch/angular-touch.js', 
				'public/lib/angular-sanitize/angular-sanitize.js', 
				'public/lib/angular-ui-router/release/angular-ui-router.min.js',
				'public/lib/angular-ui-util/index.js',
				'public/lib/flexslider/jquery-flexslider-min.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
				'public/lib/angular-xeditable/dist/js/xeditable.min.js',
				'public/lib/checklist-model/checklist-model.js',
				'public/lib/angular-local-storage/dist/angular-local-storage.min.js',
				'public/lib/angular-file-upload/dist/angular-file-upload.min.js',
				'public/lib/flexslider/jquery.flexslider-min.js',
				'public/lib/lodash/lodash.min.js',
				'public/lib/select2/select2.min.js',
				'public/lib/angular-ui-select2/src/select2.js',
				'public/lib/async/dist/async.min.js',
				'public/lib/angular-slimscroll/angular-slimscroll.min.js',
				'public/lib/angualar-wizard/dist/angular-wizard.min.js',
                'public/lib/ng-device-detector/ng-device-detector.min.js',
                'public/lib/re-tree/re-tree.min.js',
                'public/lib/ua-device-detector/ua-device-detector.min.js',
                'public/lib/angular-uuids/angular-uuid.js',
				'public/lib/angular-ui-notification/dist/angular-ui-notification.min.js',
                'public/lib/angular-messages/angular-messages.min.js',
				'public/lib/angular-material/angular-material.min.js',
                'public/lib/angularUtils-pagination/dirPagination.js',
				'public/lib/angular-aria/angular-aria.js',
				'public/lib/moment/moment.js',
                'public/lib/js-xlsx/dist/xlsx.full.min.js',
				'public/lib/angular-filter/dist/angular-filter.js/angular-filter.min.js'
			]
		},
		css: [
			'public/modules/**/css/*.*'
		],
		//css: 'public/dist/application.min.css',
		js: 'public/dist/application.min.js'
	},
    razorpay: {
        keyID: process.env.RAZORPAY_KEY_ID || 'rzp_test_uZCmnvVOJ5Nnaq',
        keySecret: process.env.RAZORPAY_KEY_SECRET || 'otLz33OxfMS5TrPuOZ4vvUEw'
    },
	facebook: {
		clientID: process.env.FACEBOOK_ID || 'APP_ID',
		clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
		callbackURL: '/auth/facebook/callback'
	},
	twitter: {
		clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
		clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
		callbackURL: '/auth/twitter/callback'
	},
	google: {
		clientID: process.env.GOOGLE_ID || 'APP_ID',
		clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
		callbackURL: '/auth/google/callback'
	},
	linkedin: {
		clientID: process.env.LINKEDIN_ID || 'APP_ID',
		clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
		callbackURL: '/auth/linkedin/callback'
	},
	github: {
		clientID: process.env.GITHUB_ID || 'APP_ID',
		clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
		callbackURL: '/auth/github/callback'
	},
    fcm: {
        url: 'https://fcm.googleapis.com/fcm/send',
        webapikey: 'AIzaSyCPnpc31YFNEqQmJOT5Spt5GPCwLBzSxPY',
        cloudmessagekey:'AIzaSyDETLsmkZRg6QbwtNFrps0hYAnRD9ngEK0',
        token: 'AAAA482ff2w:APA91bHrkQgw_-2Z6vb4m9tps6HX3xpmHa3mptO7c6PeAZ4zK6kwaTcJe7sXFEhCWRIMaR9LAeFTowa7HnyOUwOt7e5vv4G0jZY42J4Rx5OamA-z5JqgLtAZxpYWtc30g-iMNCd946YFOKhZIq9Uq51rWo1HrU9lXQ'
    },
    sms: {
        apiKey: 'f1c92131',
        apiSecret: '15a241856b86ce6b',
        fromMobileNumber: '919739206255'
    },
	mailer: {
        from: 'nVipani <info@nvipani.com>',
		options: {
			service: 'gmail',
			auth: {
				user: 'info@nvipani.com',
                pass: 'BBooster@1298'
			}
		}
	},
    mail : {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {user: 'info@nvipani.com', pass: 'BBooster@1298'},
        sender: 'nVipani <info@nvipani.com>'
    }
};
