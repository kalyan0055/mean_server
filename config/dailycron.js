'use strict';

/**
 * Module dependencies.
 */
var CronJob = require('cron').CronJob,
    mongoose = require('mongoose'),
    logger = require('../lib/log').getLogger('CRON', 'DEBUG'),
    async = require('async'),
    config = require('./config'),
    reportsUtil = require('../app/controllers/utils/reports.util'),
    nodemailer = require('nodemailer'),
    Contact = mongoose.model('Contact'),
    moment = require('moment'),
    User = mongoose.model('User'),
    Notification = mongoose.model('Notification'),
    Product = mongoose.model('Product'),
    Inventory = mongoose.model('Inventory'),
    Offer = mongoose.model('Offer'),
    Report = mongoose.model('Report'),
    Company = mongoose.model('Company'),
    Order = mongoose.model('Order');


/**
 * Update the inventory count after offer expiry
 */
function updateOfferAndInventoryProductCount(offer, done) {
    logger.info('Updating inventory product count after offer expiry of the offer number - ' + offer.offerNumber);
    var index = 0;
    async.each(offer.products, function (offerProduct, callback) {
        if (offerProduct.numberOfUnitsAvailable > 0) {
            Inventory.findById(offerProduct.inventory).exec(function (inventoryError, inventory) {
                if (inventoryError) {
                    logger.error('Error while loading the inventory with product number - ' + inventory.productNum, inventoryError);
                    callback(inventoryError);
                } else {
                    inventory.offerUnitsHistory.push({
                        offer: offer._id,
                        changeType: 'OfferExpiry',
                        changeUnits: -offerProduct.numberOfUnitsAvailable
                    });

                    inventory.offerUnits = inventory.offerUnits - offerProduct.numberOfUnitsAvailable;
                    // Needs to update the offer units also, so that numberOfUnits - offerUnits will be used for next offer creation

                    inventory.updateHistory.push({
                        modifiedOn: Date.now(),
                        modifiedBy: offer.user
                    });
                    inventory.save(function (inventorySaveErr) {
                        if (inventorySaveErr) {
                            logger.error('Error while updating the inventory with product number - ' + inventory.productNum, inventorySaveErr);
                            callback(inventorySaveErr);
                        } else {
                            logger.debug('Successfully updated the inventory count for the inventory with product number -' + inventory.productNum + ', count -' + offerProduct.numberOfUnitsAvailable + ' for the offer expiry of offer with offer number -' + offer.offerNumber);
                            offer.products[index] = offerProduct;
                            index++;
                            callback();
                        }
                    });
                }
            });
        } else {
            logger.error('There are not enough units available for the product with inventory number at offer for inventory Id: ' + offerProduct.inventory.toString());
            offer.products[index] = offerProduct;
            index++;
            callback();
        }
    }, function (err) {
        if (err) {
            done(err);
        } else {
            offer.statusHistory.push({
                status: 'Expired',
                date: Date.now(),
                user: offer.user
            });
            offer.updateHistory.push({modifiedOn: Date.now(), modifiedBy: offer.user});
            offer.offerStatus = 'Expired';
            offer.save(function (offerSaveErr) {
                if (offerSaveErr) {
                    logger.error('Error while updating the offer with offer number - ' + offer.offerNumber, offerSaveErr);
                    done(offerSaveErr);
                } else {
                    done();
                }
            });
        }
    });
}

/**
 *
 */
function generateReport(populatedOrders,report,resCompany,done) {
    reportsUtil.generateStockReport(populatedOrders, report, resCompany, function (reportGenErr, report) {
        if (reportGenErr) {
            logger.error('Error while generating the invoice for the order with Order number ', reportGenErr);
            done(reportGenErr);
        } else {
            report.save(function (err) {
                if (err) {
                    done(err);
                } else {
                    done(null, report);
                }
            });
        }
    });
}
/**
 * Report Generation for each company
 * @constructor
 */
function reportGeneration(resCompany,callback){
    async.waterfall([
        function(done){
            var report = new Report();
            report.reports = [];

            //report.reports.push({format: 'XLS'});
            report.reports.push({format: 'PDF'});
            report.company = resCompany;
            report.reportType = 'Stock';
            report.reportPeriod = 'Daily';
            var reportDate = new Date(Date.now());
            reportDate.setDate(reportDate.getDate() - 1);
            report.startDate = reportDate;
            report.endDate = reportDate;
            Company.populate(resCompany, {
                path: 'inventories.inventory.product',
                model: Product,
                select: 'name category subCategory1 subCategory2 productImageURL1 sampleNumber',
            }, function (nestedErr, populatedResultCompany) {
                if (nestedErr) {
                    logger.error('Error while inventory product details for the company-' + resCompany.name, nestedErr);
                    callback(nestedErr);
                } else {
                    Company.populate(populatedResultCompany, {
                        path: 'inventories.inventory.product.category inventories.inventory.product.subCategory1 inventories.inventory.product.subCategory2',
                        model: 'Category',
                        select: 'name'
                    }, function (nestedErrs, populatedResultsCompany) {
                        if (nestedErrs) {
                            logger.error('Error while inventory category details for the company-' + resCompany.name, nestedErrs);
                            done(nestedErrs);
                        } else {
                            reportsUtil.generateStockReport(populatedResultsCompany, report, resCompany,
                                function (reportGenErr, report) {
                                    if (reportGenErr) {
                                        logger.error('Error while generating daily stock report for the company-' + resCompany.name + ' for the date-' + report.startDate, reportGenErr);
                                        done(reportGenErr);
                                    } else {

                                        report.save(function (err) {
                                            if (err) {
                                                logger.error('Error while saving the daily stock report for the company-' + resCompany.name + ' for the date-' + report.startDate, err);
                                                done(err);
                                            } else {
                                                var salesReport = new Report();
                                                var differentTypeOfReports=['Sales', 'Purchases', 'SalesAndPurchase'];
                                                if (resCompany && resCompany.user) {

                                                    // Sales Report
                                                    Order.find({
                                                        'seller.nVipaniUser': resCompany.user
                                                    }).sort('-created').populate('user', 'displayName').populate('products.inventory', '-updateHistory -numberOfUnitsHistory -offerUnitsHistory -buyOfferUnitsHistory').exec(function (err, orders) {
                                                        if (err) {
                                                            done(err);
                                                        } else {
                                                            /* if (orders.length > 0) {*/
                                                            Order.populate(orders, {
                                                                path: 'products.inventory.product',
                                                                model: 'Product',
                                                                select: 'name category productImageURL1 unitSize unitMeasure unitPrice numberOfUnits sampleNumber fssaiLicenseNumber description user'
                                                            }, function (nestedErr, populatedOrders) {
                                                                if (nestedErr) {
                                                                    callback(nestedErr);
                                                                } else {
                                                                    if (populatedOrders.length === 0) {
                                                                        done(null, report);
                                                                    }else {

                                                                        async.each(differentTypeOfReports, function (eachReport, callback) {
                                                                            var report = new Report();
                                                                            report.reports = [];
                                                                            //report.reports.push({format: 'XLS'});
                                                                            report.reports.push({format: 'PDF'});
                                                                            report.company = resCompany;
                                                                            report.reportType = eachReport;
                                                                            report.reportPeriod = 'Daily';
                                                                            var reportDate = new Date(Date.now());
                                                                            reportDate.setDate(reportDate.getDate() - 1);
                                                                            report.startDate = reportDate;
                                                                            report.endDate = reportDate;

                                                                            generateReport(populatedOrders,report,resCompany,function (reportGenErr, report) {
                                                                               if(!reportGenErr){
                                                                                    callback(reportGenErr);
                                                                               }else{
                                                                                   callback();
                                                                               }
                                                                            });


                                                                        }, function (err) {
                                                                            if (err) {
                                                                                done(err);
                                                                            } else {
                                                                                done();
                                                                            }
                                                                        });


                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            }

                                        });
                                    }
                                });
                        }
                    });
                }
            });

        },
    ], function (err) {
        if (err)  return callback(err);
        /*else return res.status(400).send({
         status:true,
         message: req.body.username + ' sucessfully registered'
         });*/
    });

}
/**
 * Module init function.
 */
module.exports = function (app) {
    // Every 10 min
  //  var dailycron = new CronJob('0 */5 * * * *', function () {
        // Every day at 12:05AM that is 5 min after midnight
        var dailycron = new CronJob('0 5 0 * * *', function () {
        console.log('Starting Daily Cron - ' + new Date(Date.now()));

        // Set the offer state to Expire state for those offers which are expired
       Offer.find({validTill: {$lt:  moment.utc(new Date()).local()}, offerStatus: 'Opened'}).sort('-created').exec(function (err, offers) {
         if (!err) {
         offers.forEach(function (offer) {

             offer.statusHistory.push({
                 status: 'Expired',
                 date: Date.now(),
                 user: offer.user
             });
             offer.updateHistory.push({modifiedOn: moment.utc(new Date()).local(), modifiedBy: offer.user});
             offer.offerStatus = 'Expired';
             offer.save(function (offerSaveErr) {
                 if (offerSaveErr) {
                     logger.error('Error while updating the offer with offer number - ' + offer.offerNumber, offerSaveErr);
                 } else {
                     logger.debug('Offer is updated with Expired Status for -' + JSON.stringify(offer));
                 }
             });
         });
         } else {
         logger.error('Error while querying offers for updating the Offer\'s Expiry settings -' + err);
         }

         });

        // Update the orders for payment overdue
        /*Order.find({currentStatus: {$in: ['Placed', 'Confirmed', 'InProgress', 'Shipped', 'Delivered']}}).$where('this.paidAmount < this.totalAmount').sort('-created').exec(function (err, orders) {
            if (!err) {
                async.each(orders, function (order, callback) {
                    /!* if (order.paidAmount < order.totalAmount) {*!/
                    // Update the order with payment overdue
                    var updateRequired = false;
                    if (order.paymentOptionType.payNow.selection && order.paymentOptionType.payNow.selection === true && order.paymentOptionType.payNow.status === 'YetToPay') {
                        logger.debug('Setting the pay now payment status to Overdue for the order with order number' + order.orderNumber);
                        order.paymentOptionType.payNow.status = 'Overdue';
                        updateRequired = true;
                    } else if (order.paymentOptionType.payOnDelivery.selection && order.paymentOptionType.payOnDelivery.selection === true && order.currentStatus === 'Delivered' && order.paymentOptionType.payOnDelivery.status === 'YetToPay') {
                        logger.debug('Setting the pay on delivery payment status to Overdue for the order with order number' + order.orderNumber);
                        order.paymentOptionType.payOnDelivery.status = 'Overdue';
                        updateRequired = true;
                    } else if (order.paymentOptionType.lineOfCredit.selection && order.paymentOptionType.lineOfCredit.selection === true && order.paymentOptionType.lineOfCredit.status === 'YetToPay') {
                        var arrHistory = order.statusHistory.filter(function (history) {
                            if (history.status && (history.status === 'Confirmed')) {
                                return true;
                            } else {
                                return false;
                            }
                        });

                        var orderDate = order.created;
                        if (arrHistory && arrHistory.length > 0) {
                            orderDate = arrHistory[0].date;
                        }

                        var paymentDate = orderDate.getTime() + order.paymentOptionType.lineOfCredit.days * 24 * 60 * 60 * 1000;
                        var currentDate = Date.now();
                        if (paymentDate < currentDate) {
                            logger.debug('Setting the line of credit payment status to Overdue for the order with order number' + order.orderNumber);
                            order.paymentOptionType.lineOfCredit.status = 'Overdue';
                            updateRequired = true;
                        }
                    } else if (order.paymentOptionType.installments.enabled && order.paymentOptionType.installments.enabled === true) {
                        var historyArr = order.statusHistory.filter(function (history) {
                            if (history.status && (history.status === 'Confirmed')) {
                                return true;
                            } else {
                                return false;
                            }
                        });

                        var ordDate = order.created;
                        if (historyArr && historyArr.length > 0) {
                            ordDate = historyArr[0].date;
                        }
                        for (var i = 0; i < order.paymentOptionType.installments.options.length; i++) {
                            if (order.paymentOptionType.installments.options[i].status === 'YetToPay') {
                                var payDate = ordDate.getTime() + order.paymentOptionType.installments.options[i].days * 24 * 60 * 60 * 1000;
                                var curDate = Date.now();
                                if (payDate < curDate) {
                                    order.paymentOptionType.installments.options[i].status = 'Overdue';
                                    updateRequired = true;
                                }
                            }
                        }
                    }
                    if (updateRequired && updateRequired === true) {
                        order.save(function (orderSaveErr) {
                            if (orderSaveErr) {
                                logger.error('Error while updating the order with order number - ' + order.orderNumber, orderSaveErr);
                                callback(orderSaveErr);
                            } else {
                                callback();
                            }
                        });
                    }
                    /!* } else {
                     callback();
                     }*!/

                }, function (updateOrdersErr) {
                    if (updateOrdersErr) {
                        logger.error('Error while updating the orders for payment overdue.', updateOrdersErr);
                    }
                });
            } else {
                logger.error('Error while querying orders for updating payment overdue status', err);
            }

        });
*/
        // generate reports.

       /* var reportType=['SalesAndPurchase','Stock'];
        Company.find({}, '-settings -updateHistory -companiesVersionKey -bankAccountDetailsProof -bankAccountDetails -panNumberProof -panNumber -cstNumber -cstNumberProof -vatNumber -vatNumberProof -tinNumber -tinNumberProof').populate('inventories.inventory', '-updateHistory -numberOfUnitsHistory -offerUnitsHistory -buyOfferUnitsHistory').populate('user', 'displayName').exec(function (companyErr, companies) {
            if (!companyErr) {
                async.each(companies, function (resCompany, callback) {

                    reportGeneration(resCompany, function (updateInventoryErr) {
                        if (updateInventoryErr instanceof Error) {
                            logger.error('Error while generating report -' + updateInventoryErr);
                        } else {
                            logger.debug('Genearted Report for the company : -r -' + JSON.stringify(resCompany));
                        }
                    });
                });
            }
        });
   */ }, null, true);
};


