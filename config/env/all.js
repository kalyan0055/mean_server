'use strict';

module.exports = {
	app: {
        title: 'nVipani - Total Control on Your Supply Chain Ecosystem',
        description: 'Total Control on Your Supply Chain Ecosystem',
        keywords: 'nVipani,nVipani,Supply Chain Management,Counterfeits, Counterfeit, Pilferage, Product Recall, Trace to Origin, Product Exipry, SCM,Marketplace,nVipani,Agriculture,Agriculture Products,Agriculture Produce,Buy,Sell,Mediate,Sample Mediation,Cotton,Pulses,Cereals,Spices,Vegetable,Yarn,Fabric,Apparel,FMCG,Consumer Goods,Invoice,Order,Payments,Textiles'
	},
  /*  db: {
        promise: global.Promise
    },*/
	port: process.env.PORT || 8081,
    host: process.env.HOST || '0.0.0.0',
    // DOMAIN config should be set to the fully qualified application accessible
    // URL. For example: https://www.myapp.com (including port if required).
    domain: process.env.DOMAIN,
    // Session Cookie settings
    sessionCookie: {
        // session expiration is set by default to 24 hours
        maxAge: 24 * (60 * 60 * 1000),
        // httpOnly flag makes sure the cookie is only accessed
        // through the HTTP protocol and not JS/browser
        httpOnly: true,
        // secure cookie should be turned to true to provide additional
        // layer of security so that the cookie is set only when working
        // in HTTPS mode.
        secure: false
    },
	reportPort: 4000,
    production: false,
	templateEngine: 'swig',
	sessionSecret: 'MEAN',
	sessionCollection: 'sessions',
 
};
