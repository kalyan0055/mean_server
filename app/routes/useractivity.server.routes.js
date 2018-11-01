'use strict'

module.exports = function(app){
    var users = require('../../app/controllers/internaluser.server.controller');
    var useractivity = require('../controllers/usersactivity.server.controller');

    app.route('/saveActivity').post(users.requiresLogin,useractivity.saveActivity)
    app.route('/getUserActivities').post(users.requiresLogin,useractivity.getUserActivities)
    app.route('/getActivitiesByType').post(useractivity.getActivitiesByType)
    
    
}
