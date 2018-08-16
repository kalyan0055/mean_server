'use strict';

module.exports = function (app) {
    var users = require('../controllers/users.server.controller');
    var unitofmeasures = require('../controllers/unitofmeasures.server.controller');

    // UnitOfMeasures Routes
    app.route('/unitofmeasures')
        .get(unitofmeasures.list)
        .post(users.requiresLogin, unitofmeasures.create);
    // app.route('/unitofmeasures').post(users.requiresLogin, unitofmeasures.create);    
    app.route('/massunitofmeasures')
        .get(users.requiresLogin, unitofmeasures.list)
        .post(users.requiresLogin, unitofmeasures.createMassInsert);
    app.route('/unitofmeasures/:unitofmeasureId')
        .get(users.requiresLogin, unitofmeasures.read)
        .put(users.requiresLogin, unitofmeasures.hasAuthorization, unitofmeasures.update)
        /*.delete(users.requiresLogin, unitofmeasures.hasAuthorization, unitofmeasures.delete)*/;
    app.route('/uomSearch')
        .get(users.requiresLogin,unitofmeasures.UOMSearch);

    app.param('unitofmeasureId', unitofmeasures.unitOfMeasureByID);
};
