'use strict';

module.exports = {
	port: 443,
	db: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI || 'mongodb://localhost/nvipani',
	assets: {
		lib: {
			css: [
				'public/lib/bootstrap/dist/css/bootstrap.min.css',
				'public/lib/bootstrap/dist/css/bootstrap.css',
				'public/lib/bootstrap/dist/css/bootstrap-theme.min.css',
				'public/lib/angular-xeditable/dist/css/xeditable.css',
				'public/lib/flexslider/flexslider.css',
				'public/lib/select2/select2.css',
				'public/lib/select2/select2-bootstrap.css',
				'public/lib/font-awesome/css/font-awesome.min.css'
			],
			js: [
				'public/lib/jquery/dist/jquery.min.js',
				'public/lib/bootstrap/dist/js/bootstrap.min.js',
				'public/lib/angular/angular.min.js',
				'public/lib/angular-resource/angular-resource.min.js',
				'public/lib/angular-cookies/angular-cookies.min.js',
				'public/lib/angular-animate/angular-animate.min.js',
				'public/lib/angular-touch/angular-touch.min.js',
				'public/lib/angular-sanitize/angular-sanitize.min.js',
				'public/lib/angular-ui-router/release/angular-ui-router.min.js',
				'public/lib/angular-ui-utils/ui-utils.min.js',
				'public/lib/angular-bootstrap/ui-bootstrap-tpls.min.js',
                'public/lib/angular-messages/angular-messages.min.js',
				'public/lib/angular-xeditable/dist/js/xeditable.js',
				'public/lib/checklist-model/checklist-model.js',
				'public/lib/angular-local-storage/dist/angular-local-storage.min.js',
				'public/lib/angular-file-upload/dist/angular-file-upload.min.js',
				'public/lib/flexslider/jquery.flexslider-min.js',
                'public/lib/ng-device-detector/ng-device-detector.min.js',
                'public/lib/re-tree/re-tree.min.js',
                'public/lib/angular-uuids/angular-uuid.js',
				'public/lib/lodash/lodash.min.js',
				'public/lib/select2/select2.js',
				'public/lib/angular-ui-select2/src/select2.js',
				'public/lib/async/dist/async.js',
				'public/lib/angular-slimscroll/angular-slimscroll.js',
				'public/lib/moment/moment.js',
			]
		},
		css: 'public/dist/application.min.css',
		js: 'public/dist/application.min.js'
	},
    razorpay: {
        keyID: process.env.RAZORPAY_KEY_ID || 'rzp_test_uZCmnvVOJ5Nnaq',
        keySecret: process.env.RAZORPAY_KEY_SECRET || 'otLz33OxfMS5TrPuOZ4vvUEw'
    },
	facebook: {
		clientID: process.env.FACEBOOK_ID || 'APP_ID',
		clientSecret: process.env.FACEBOOK_SECRET || 'APP_SECRET',
		callbackURL: 'https://localhost:443/auth/facebook/callback'
	},
	twitter: {
		clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
		clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
		callbackURL: 'https://localhost:443/auth/twitter/callback'
	},
	google: {
		clientID: process.env.GOOGLE_ID || 'APP_ID',
		clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
		callbackURL: 'https://localhost:443/auth/google/callback'
	},
	linkedin: {
		clientID: process.env.LINKEDIN_ID || 'APP_ID',
		clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
		callbackURL: 'https://localhost:443/auth/linkedin/callback'
	},
	github: {
		clientID: process.env.GITHUB_ID || 'APP_ID',
		clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
		callbackURL: 'https://localhost:443/auth/github/callback'
	},
    fcm: {
        webapikey: 'AIzaSyCPnpc31YFNEqQmJOT5Spt5GPCwLBzSxPY',
        token: 'AAAA482ff2w:APA91bHrkQgw_-2Z6vb4m9tps6HX3xpmHa3mptO7c6PeAZ4zK6kwaTcJe7sXFEhCWRIMaR9LAeFTowa7HnyOUwOt7e5vv4G0jZY42J4Rx5OamA-z5JqgLtAZxpYWtc30g-iMNCd946YFOKhZIq9Uq51rWo1HrU9lXQ'
    },
    sms: {
        apiKey: 'f1c92131',
        apiSecret: '15a241856b86ce6b',
        fromMobileNumber: '919739206255'
    },
	mailer: {
		//from: process.env.MAILER_FROM || 'MAILER_FROM',
        from: 'nVipani <mail.evipani@gmail.com>',
		options: {
			//service: process.env.MAILER_SERVICE_PROVIDER || 'MAILER_SERVICE_PROVIDER',
			service: 'gmail',
			auth: {
				//user: process.env.MAILER_EMAIL_ID || 'MAILER_EMAIL_ID',
				user:'mail.evipani',
				pass:'evipani1298'
				//pass: process.env.MAILER_PASSWORD || 'MAILER_PASSWORD'
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
