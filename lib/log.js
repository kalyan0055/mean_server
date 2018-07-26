'use strict';
var config = require('../config/config'),
    fs = require('fs');

var log4js = require('log4js');
log4js.configure({
    appenders: [
    {
        type: 'file',
        filename: fs.exists(config.log.file)?config.log.file:process.cwd()+'/app.log',
        maxLogSize: 50*1024,
        backups: 5,
        category: ['CRON', 'MAIL', 'USERS', 'SENDMAIL', 'API', 'COMPANY', 'Leads', 'MESSAGES', 'OFFERS', 'ORDERS', 'Product', 'Todo', 'REPORT', 'NOTIFICATION', 'UNITOFMEASURE', 'STOCKMASTER', 'TAXGROUP', 'IMPORTFILE','CONTACT','GROUP']
    },
    {
        type: 'console'
    }],
    replaceConsole: true
});

var debuglog = log4js.getLogger('debug');
debuglog.setLevel('DEBUG');
var errorlog = log4js.getLogger('error');
errorlog.setLevel('ERROR');

var logger = { 
   getLogger: function(name, level) {
		var l = log4js.getLogger(name);
		l.setLevel(level.toUpperCase());
		return l;
   }
};

module.exports = logger;
