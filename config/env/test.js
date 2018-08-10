'use strict';

module.exports = {
	db: 'mongodb://localhost/nvipani-test',
	port: 3001,
    sendNotification:false,
    sendSMS:false,
    sendEmail:false,
	app: {
		title: 'nVipani - Test Environment'
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
        webapikey: 'AIzaSyCPnpc31YFNEqQmJOT5Spt5GPCwLBzSxPY',
        token: 'AAAA482ff2w:APA91bHrkQgw_-2Z6vb4m9tps6HX3xpmHa3mptO7c6PeAZ4zK6kwaTcJe7sXFEhCWRIMaR9LAeFTowa7HnyOUwOt7e5vv4G0jZY42J4Rx5OamA-z5JqgLtAZxpYWtc30g-iMNCd946YFOKhZIq9Uq51rWo1HrU9lXQ'
    },
    sms: {
        apiKey: 'f1c92131',
        apiSecret: '15a241856b86ce6b',
        fromMobileNumber: '919739206255'
    },
    mailer: {
        from: 'mail.evipani@gmail.com',
        options: {
            service: 'gmail',
            auth: {
                user: 'mail.evipani@gmail.com',
                pass: 'evipani1298'
            }
        }
    },
    mail : {
        host: 'smtp.gmail.com',
        auth: {user: 'mail.evipani@gmail.com', pass: 'evipani1298'},
        sender: 'mail.evipani@gmail.com'
    }
};
