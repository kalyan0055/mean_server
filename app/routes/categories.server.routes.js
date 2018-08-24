'use strict';

module.exports = function (app) {
    var users = require('../../app/controllers/users.server.controller');
    var categories = require('../../app/controllers/categories.server.controller');
    //var products = require('../../app/controllers/products.server.controller');

    // Categories Routes
    app.route('/categories')
        .get(categories.list);
        // .post(users.requiresLogin, products.createProduct);
    app.route('/createMainCategory')
        .get(categories.list)
        .post(users.requiresLogin, categories.create);

    app.route('/createMainCategory/:categoryId')
        .put(users.requiresLogin,categories.update);

    app.route('/queryMainCategories')
        .get(categories.listMainCategories);

    app.route('/queryMainCategoriesSearch')
        .get(categories.listMainCategoriesWithSearch);

    app.route('/queryCategoriesSearch')
        .get(categories.listSubCategories1Search);

    app.route('/querySubCategories1')
        .get(users.requiresLogin, categories.listSubCategories1);

    app.route('/querySubCategories2')
        .get(users.requiresLogin, categories.listSubCategories2);

    app.route('/querySubCategories3')
        .get(users.requiresLogin, categories.listSubCategories3);
   /* app.route('/productCategorySearch')
    .get(categories.productCategorySearch);*/
    app.route('/fetchProductMaster').post(users.requiresLogin,categories.fetchProducts);
    app.route('/fetchSubCategoryByName').post(users.requiresLogin,categories.fetchSubCategoryByName);
    app.route('/fetchProductsName').post(users.requiresLogin,categories.fetchProductImport);
    app.route('/categories/:categoryId')
        .get(categories.read)
        .put(users.requiresLogin, categories.hasAuthorization, categories.update);
        /*.delete(users.requiresLogin, categories.hasAuthorization, categories.delete);*/

    // Finish by binding the Category middleware
    app.param('categoryId', categories.categoryByID);
    app.route('/categories/hsncodeCreate')
        .post(users.requiresLogin, categories.createHsnCodes);
};
