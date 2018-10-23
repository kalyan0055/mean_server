'use strict'


module.exports = function(app){
var settings = require('../controllers/settings.server.controller');
var users = require('../../app/controllers/internaluser.server.controller');

app.route('/settings_new').post(users.requiresLogin,settings.insertSettings);
app.route('/settings_new/:id').get(settings.getSettings).delete(settings.deleteSettingById);
app.route('/settings_list').post(settings.getSettings_ajax);
}