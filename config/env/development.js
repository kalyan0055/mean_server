'use strict';

module.exports = {

    //db: 'mongodb://localhost/nvipani-dev1',
//	db: 'mongodb://localhost/nvipani-dev', just commented
	db: 'mongodb://127.0.0.1:27017/mean',
    //db: 'mongodb://localhost/nvipani-test',
   /* db: {
        uri: process.env.MONGOHQ_URL || process.env.MONGODB_URI || 'mongodb://' + (process.env.DB_1_PORT_27017_TCP_ADDR || 'localhost') + '/nvipani-dev',
        options: {},
        // Enable mongoose debug mode
        debug: process.env.MONGODB_DEBUG || false
    },*/
   // db:'mongodb://hema:secretPassword@' + (process.env.DB_1_PORT_27017_TCP_ADDR || '192.168.1.126')+'/nvipani-dev',
	app: {
        title: 'nVipani Dev - Total Control on Your Supply Chain Ecosystem'
    },
    sendNotification: false,
    sendSMS:false,
    sendEmail: false,
	log: {
		// logging with Morgan - https://github.com/expressjs/morgan
		// Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
		format: 'dev',
		options: {
			// Stream defaults to process.stdout
			// Uncomment/comment to toggle the logging to a log on the file system
			//stream: {
			//  directoryPath: process.cwd(),
			//  fileName: 'access.log',
			//  rotatingLogs: { // for more info on rotating logs - https://github.com/holidayextras/file-stream-rotator#usage
			//    active: false, // activate to use rotating logs
			//    fileName: 'access-%DATE%.log', // if rotating logs are active, this fileName setting will be used
			//    frequency: 'daily',
			//    verbose: false
			//  }
			//}
		}
	},
    razorpay: {
        keyID: process.env.RAZORPAY_KEY_ID || 'rzp_test_uZCmnvVOJ5Nnaq',
        keySecret: process.env.RAZORPAY_KEY_SECRET || 'otLz33OxfMS5TrPuOZ4vvUEw'
    },
	facebook: {
		clientID: process.env.FACEBOOK_ID || '1664835317079773',
		clientSecret: process.env.FACEBOOK_SECRET || '433ef21a6d70b192fb20fcbdb0e4fa3d',
		callbackURL: '/auth/facebook/callback'
	},
	/*twitter: {
		clientID: process.env.TWITTER_KEY || 'CONSUMER_KEY',
		clientSecret: process.env.TWITTER_SECRET || 'CONSUMER_SECRET',
		callbackURL: '/auth/twitter/callback'
	},*/
	google: {
		clientID: process.env.GOOGLE_ID || 'APP_ID',
		clientSecret: process.env.GOOGLE_SECRET || 'APP_SECRET',
		callbackURL: '/auth/google/callback'
	},
	/*linkedin: {
		clientID: process.env.LINKEDIN_ID || 'APP_ID',
		clientSecret: process.env.LINKEDIN_SECRET || 'APP_SECRET',
		callbackURL: '/auth/linkedin/callback'
	},
	github: {
		clientID: process.env.GITHUB_ID || 'APP_ID',
		clientSecret: process.env.GITHUB_SECRET || 'APP_SECRET',
		callbackURL: '/auth/github/callback'
	},*/
	/*mailer: {
		//from: process.env.MAILER_FROM || 'MAILER_FROM',
		from:'N Vipani Administrator <mail.evipani@gmail.com>',
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
	}*/
    fcm: {
        url: 'https://fcm.googleapis.com/fcm/send',
        webapikey: 'AIzaSyCPnpc31YFNEqQmJOT5Spt5GPCwLBzSxPY',
		cloudmessagekey:'AIzaSyDETLsmkZRg6QbwtNFrps0hYAnRD9ngEK0',
			token: 'AAAA482ff2w:APA91bHrkQgw_-2Z6vb4m9tps6HX3xpmHa3mptO7c6PeAZ4zK6kwaTcJe7sXFEhCWRIMaR9LAeFTowa7HnyOUwOt7e5vv4G0jZY42J4Rx5OamA-z5JqgLtAZxpYWtc30g-iMNCd946YFOKhZIq9Uq51rWo1HrU9lXQ'
    },
    // sms: {
    //     apiKey: 'f1c92131',
    //     apiSecret: '15a241856b86ce6b',
    //     fromMobileNumber: '919739206255'
    // },
    // mailer: {
    //     from: 'nVipani <info@nvipani.com>',
    //     options: {
    //         service: 'gmail',
    //         auth: {
    //             user: 'info@nvipani.com',
    //             pass: 'BBooster@1298'
    //         }
    //     }
	// },rambabuemandi77@gmail.com
	mailer: {
        from: 'nVipani <rambabuemandi77@gmail.com>',
        options: {
            service: 'gmail',
            auth: {
                user: 'rambabuemandi77@gmail.com',
                pass: 'sachintendulkar'
            }
        }
    },
    // mail : {
    //     host: 'smtp.gmail.com',
    //     port: 587,
    //     auth: {user: 'info@nvipani.com', pass: 'BBooster@1298'},
    //     sender: 'nVipani <info@nvipani.com>'
    // }
};
