'use strict';

module.exports = function (app) {
    var users = require('../controllers/users.server.controller');
    var hsncodes = require('../controllers/hsncodes.server.controller');

    // UnitOfMeasures Routes
    app.route('/hsncodeslist')
    .post(hsncodes.list);
     app.route('/hsncodes')
        .post(users.requiresLogin, hsncodes.createHsnCodes);
    app.route('/hsnupdate')
        .post(users.requiresLogin, hsncodes.updateHsnCode);
    app.route('/hsndelete')
        .post(users.requiresLogin, hsncodes.deletehsn);    
    // app.route('/massunitofmeasures')
    //     .get(users.requiresLogin, unitofmeasures.list)
    //     .post(users.requiresLogin, unitofmeasures.createMassInsert);
    // app.route('/unitofmeasures/:unitofmeasureId')
    //     .get(users.requiresLogin, unitofmeasures.read)
    //     .put(users.requiresLogin, unitofmeasures.hasAuthorization, unitofmeasures.update)
        /*.delete(users.requiresLogin, unitofmeasures.hasAuthorization, unitofmeasures.delete)*/;
    // app.route('/uomSearch')
    //     .get(users.requiresLogin,unitofmeasures.UOMSearch);

    // app.param('unitofmeasureId', unitofmeasures.unitOfMeasureByID);
};
