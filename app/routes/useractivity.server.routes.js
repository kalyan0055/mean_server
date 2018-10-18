'use strict'

module.exports = function(app){
    var users = require('../../app/controllers/users.server.controller');
    var useractivity = require('../controllers/usersactivity.server.controller');

    app.route('/saveActivity').post(users.requiresLogin,useractivity.saveActivity)
    
 
}
