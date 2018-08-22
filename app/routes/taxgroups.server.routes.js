'use strict';

module.exports = function (app) {
    var users = require('../../app/controllers/users.server.controller');
    var taxGroup = require('../../app/controllers/taxgroup.server.controller');

    // Todos Routes
    app.route('/taxGroup')
    .get(taxGroup.list)
    .post(users.requiresLogin, taxGroup.create);

    app.route('/deleteTaxGroups')
      .post(users.requiresLogin, taxGroup.delete)
 
    
    // app.route('/taxGroup')
    //     .get(taxGroup.list)
    //     .post(users.requiresLogin, taxGroup.createMassInsert);

    app.route('/taxGroup/:taxGroupById')
        .get(taxGroup.read)
        .put(taxGroup.update)
        /*.delete(users.requiresLogin, taxGroup.hasAuthorization, taxGroup.delete)*/;
    app.route('/taxSearch')
        .get(users.requiresLogin,taxGroup.taxGroupSearch);
    app.route('/hsncodeSearch')
        .get(users.requiresLogin,taxGroup.hsnCodeSearch);
    // Finish by binding the Todo middleware
    app.param('taxGroupById', taxGroup.taxGroupById);
};
