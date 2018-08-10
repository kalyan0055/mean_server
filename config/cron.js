'use strict';

/**
 * Module dependencies.
 */
var CronJob = require('cron').CronJob,
    mongoose = require('mongoose'),
    logger = require('../lib/log').getLogger('CRON', 'DEBUG'),
    notificationUtil = require('../app/controllers/utils/notification.util'),
    async = require('async'),
    config = require('./config'),
    nodemailer = require('nodemailer'),
    Contact = mongoose.model('Contact'),
    User = mongoose.model('User'),
    Notification = mongoose.model('Notification'),
    Product = mongoose.model('Product'),
    Offer = mongoose.model('Offer'),
    Order = mongoose.model('Order'),
    Message = mongoose.model('Message'),
    Leads = mongoose.model('Leads');


/*var sendNotification = function (app, notification, done) {
    async.waterfall([
        function prepareNotification(done) {
            var firstName;
            var lastName;
            if (notification.target.nVipaniUser) {
                firstName = notification.target.nVipaniUser.firstName;
                lastName = notification.target.nVipaniUser.lastName;
            } else if (notification.target.contact) {
                firstName = notification.target.contact.firstName;
                lastName = notification.target.contact.lastName;
            }
            if (notification.source && notification.source.message && notification.type && notification.type === 'OrderComment' && notification.source.order) {
                Message.findById(notification.source.message).exec(function (err, resultMessage) {
                    if (err) {
                        logger.error('Error while loading the message details with message id - ' + notification.source.message._id + ' of order comment message notification');
                        done(err);
                    } else {
                        Order.findById(notification.source.order).populate('buyer.contact seller.contact mediator.contact', 'firstName lastName middleName addresses').populate('user', 'displayName').exec(function (err, resultOrder) {
                            if (err) {
                                logger.error('Error while loading the Order details with order id- ' + notification.source.order + ' of order comment message notification');
                                done(err);
                            } else {
                                User.findOne({
                                    '_id': resultOrder.user.id
                                }, '-salt -password', function (dbuserErr, dbuser) {
                                    if (!dbuserErr) {
                                        app.render('templates/order-comment', {
                                            name: firstName + ' ' + lastName,
                                            appName: config.app.title,
                                            title: notification.title,
                                            orderNumber: resultOrder.orderNumber,
                                            orderStatus: resultOrder.currentStatus,
                                            buyer: resultOrder.buyer.contact.firstName + ' ' + resultOrder.buyer.contact.lastName,
                                            seller: resultOrder.seller.contact.firstName + ' ' + resultOrder.seller.contact.lastName,
                                            orderType: resultOrder.orderType,
                                            totalAmount: resultOrder.totalAmount,
                                            paidAmount: resultOrder.paidAmount,
 url: dbuser.serverUrl + '/orders/' + notification.source.order,
                                            comment: resultMessage.body
                                        }, function (err, emailHTML) {
                                            done(err, emailHTML);
                                        });
                                    } else {
                                        done(dbuserErr);
                                    }
                                });
                            }
                        });
                    }
                });
            } else if (notification.source && notification.source.message && notification.type && notification.type === 'OfferComment' && notification.source.offer) {
                Message.findById(notification.source.message).exec(function (err, resultMessage) {
                    if (err) {
                        logger.error('Error while loading the message details with message id - ' + notification.source.message._id + ' of offer comment message notification');
                        done(err);
                    } else {
                        Offer.findById(notification.source.offer).populate('user', 'displayName').exec(function (err, resultOffer) {
                            if (err) {
                                logger.error('Error while loading the offer details with offer id - ' + notification.source.offer._id + ' of offer comment message notification');
                                done(err);
                            } else {
                                User.findOne({
                                    '_id': resultOffer.user.id
                                }, '-salt -password', function (dbuserErr, dbuser) {
                                    if (!dbuserErr) {
                                        app.render('templates/offer-comment', {
                                            name: firstName + ' ' + lastName,
                                            appName: config.app.title,
                                            title: notification.title,
                                            offerName: resultOffer.name,
                                            offerType: resultOffer.offerType,
                                            offerValidTill: resultOffer.validTill,
 url: dbuser.serverUrl + '/offers/' + notification.source.offer,
                                            comment: resultMessage.body
                                        }, function (err, emailHTML) {
                                            done(err, emailHTML);
                                        });
                                    } else {
                                        logger.error('Error while loading the user details with user id - ' + resultOffer.user.id + ' of offer comment message notification');
                                        done(dbuserErr);
                                    }
                                });
                            }
                        });
                    }
                });
            } else if (notification.source && notification.source.offer) {
                Offer.findById(notification.source.offer).populate('products.inventory').populate('user', 'displayName').exec(function (err, resultOffer) {
                    if (err) {
                        logger.error('Error while loading the offer details with offer id - ' + notification.source.offer._id + ' of offer notification');
                        done(err);
                    } else {
                        Offer.populate(resultOffer, {
                            path: 'products.inventory.product',
                            model: Product,
                            select: 'name category productImageURL1'
                        }, function (nestedErr, offer) {

                            if (nestedErr) {
                                done(nestedErr);
                            } else {
                                User.findOne({
                                    '_id': offer.user.id
                                }, '-salt -password', function (dbuserErr, dbuser) {
                                    if (!dbuserErr) {

                                        app.render('templates/offer-creation', {
                                            name: firstName + ' ' + lastName,
                                            appName: config.app.title,
                                            title: notification.title,
                                            fromName: offer.user.displayName,
                                            offerName: offer.name,
                                            offerType: offer.offerType,
                                            offerValidTill: offer.validTill,
 url: dbuser.serverUrl + '/offers/' + notification.source.offer,
                                            products: offer.products
                                        }, function (err, emailHTML) {
                                            done(err, emailHTML);
                                        });
                                    } else {
                                        done(dbuserErr);
                                    }
                                });
                            }
                        });
                    }
                });
            } else if (notification.source && notification.source.order) {
                Order.findById(notification.source.order).populate('buyer.contact seller.contact mediator.contact', 'firstName lastName middleName addresses').populate('products.inventory').populate('user', 'displayName').exec(function (err, resultOrder) {
                    if (err) {
                        logger.error('Error while loading the Order details with order id- ' + notification.source.order);
                        done(err);
                    } else {
                        Order.populate(resultOrder, {
                            path: 'products.inventory.product',
                            model: Product,
                            select: 'name category productImageURL1'
                        }, function (nestedErr, order) {
                            if (nestedErr) {
                                done(nestedErr);
                            } else {
                                User.findOne({
                                    '_id': order.user.id
                                }, '-salt -password', function (dbuserErr, dbuser) {
                                    if (!dbuserErr) {

                                        app.render('templates/new-order-creation', {
                                            name: firstName + ' ' + lastName,
                                            appName: config.app.title,
                                            title: notification.title,
                                            fromName: order.user.displayName,
                                            orderNumber: order.orderNumber,
                                            orderStatus: order.currentStatus,
                                            buyer: order.buyer.contact.firstName + ' ' + order.buyer.contact.lastName,
                                            seller: order.seller.contact.firstName + ' ' + order.seller.contact.lastName,
                                            orderType: order.orderType,
                                            totalAmount: order.totalAmount,
                                            paidAmount: order.paidAmount,
 url: dbuser.serverUrl + '/orders/' + notification.source.order,
                                            products: order.products
                                        }, function (err, emailHTML) {
                                            done(err, emailHTML);
                                        });
                                    } else {
                                        done(dbuserErr);
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                app.render('templates/order-creation', {
                    name: firstName + ' ' + lastName,
                    appName: config.app.title,
                    title: notification.title
                }, function (err, emailHTML) {
                    done(err, emailHTML);
                });
            }

        },
        function sendNotification(emailHTML, done) {
            var email;
            if (notification.target.nVipaniUser) {
                email = notification.target.nVipaniUser.email;
            } else if (notification.target.contact && notification.target.contact.emails && notification.target.contact.emails.length > 0) {
                email = notification.target.contact.emails[0].email;
            }
            if (email) {
                var smtpTransport = nodemailer.createTransport(config.mailer.options);
                var mailOptions = {
                    to: email,
                    from: config.mailer.from,
                    subject: notification.title,
                    html: emailHTML
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                    logger.debug('An email has been sent to ' + email + ' with notification details.');
                    done(err);
                });
            } else {
                logger.debug('Email notification could not be sent as no email present for the target contact.');
                done(new Error('Email notification could not be sent as no email present for the target contact.'));
            }
        }
    ], function (err) {
        if (err) {
            return done(err);
        } else {
            done(null);
        }
    });
 };*/
var sendLeadContactsNotification = function (app, lead, done) {
    async.waterfall([
        function prepareNotification(done) {
            app.render('templates/lead-send', {
                name: lead.name,
                appName: config.app.title,
                title: 'Lead Contact',
                description: lead.description
            }, function (err, emailHTML) {
                done(err, emailHTML);
            });
        },
        function sendNotification(emailHTML, done) {
            var smtpTransport = nodemailer.createTransport(config.mailer.options);
            var mailOptions = {
                to: config.mailer.from,
                from: lead.email,
                subject: 'Lead contact Information',
                html: emailHTML
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                logger.debug('An email is been sent to ' + lead.email + ' with lead description.');
                done(err);
            });
        }
    ], function (err) {
        if (err) {
            return done(err);
        }else{
            done(null);
        }
    });
};
var sendProductionRegistrationNotification = function (app, user, done) {
    async.waterfall([
        function(done) {
             var valid=false;
                app.render('templates/user-registration', {
                    name: 'Register',
                    appName: config.app.title,
                    url: user.serverUrl+'/user/register/' + user.statusToken
                }, function (err, emailHTML) {
                    done(err, emailHTML);
                });

        },
        function sendNotification(emailHTML, done) {
            var smtpTransport = nodemailer.createTransport(config.mailer.options);
            var mailOptions = {
                to:user.username ,
                username:user.username,
                from: config.mailer.from,
                subject: 'Registration Request',
                html: emailHTML
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                logger.debug('An email is been sent to ' +  user.username + ' with lead description.');
                done(err);
            });
        }
    ], function (err) {
        if (err) {
            return done(err);
        }else {
            done(null);
        }
    });
};

/**
 * Module init function.
 */
module.exports = function (app) {
    var cron = new CronJob('0 23 * * * *', function () {
        console.log('Starting Cron - ' + new Date(Date.now()));
        if(config.sendMail) {
            Notification.find({processed: false}).sort('-created').populate('target.contact target.nVipaniUser', 'firstName lastName emails phones email mobile').exec(function (err, notifications) {
                if (!err) {
                    notifications.forEach(function (notification) {
                        if (notification.target && ((notification.target.contact && notification.target.contact.emails && notification.target.contact.emails.length > 0) || (notification.target.nVipaniUser && notification.target.nVipaniUser.email))) {
                            var firstName;
                            var lastName;
                            if (notification.target.nVipaniUser) {
                                firstName = notification.target.nVipaniUser.firstName;
                                lastName = notification.target.nVipaniUser.lastName;
                            } else if (notification.target.contact) {
                                firstName = notification.target.contact.firstName;
                                lastName = notification.target.contact.lastName;
                            }
                            logger.debug('Processing the notification with title - ' + notification.title + ', target contact -' + firstName + ' ' + lastName + ' and type-' + notification.type);
                            notificationUtil.sendNotification(app, notification, function (sendNotificationErr) {
                                if (!sendNotificationErr) {
                                    logger.debug('Processed the notification with title - ' + notification.title + ', target contact -' + firstName + ' ' + lastName + ' and type-' + notification.type);
                                    notification.processed = true;
                                    notification.statusMessage = 'Successfully processed the notification with title - ' + notification.title + ', target contact -' + firstName + ' ' + lastName + ' and type-' + notification.type;
                                    notification.save(function (err) {
                                        if (err) {
                                            logger.error('Error while updating the notification with title - ' + notification.title, err);
                                        }
                                    });
                                } else {
                                    //notification.processed = true;
                                    notification.statusMessage = 'Failed in processing the notification with title - ' + notification.title + ', target contact -' + firstName + ' ' + lastName + ' and type-' + notification.type + '. Error - ' + sendNotificationErr;
                                    logger.error('Error in processing the notification with title - ' + notification.title + ', target contact -' + firstName + ' ' + lastName + ' and type-' + notification.type, sendNotificationErr);
                                    notification.save(function (err) {
                                        if (err) {
                                            logger.error('Error while updating the notification with title - ' + notification.title, err);
                                        }
                                    });
                                }
                            });
                        } else {
                            //notification.processed = true;
                            notification.statusMessage = 'Error while processing the notification with title-' + notification.title + ' as notification target contact email(s) are not present.';
                            logger.error('Error while processing the notification with title-' + notification.title + ' as notification target contact email(s) are not present.');
                            notification.save(function (err) {
                                if (err) {
                                    logger.error('Error while updating the notification with title - ' + notification.title, err);
                                }
                            });
                        }
                    });
                } else {
                    logger.error('Error while getting the notifications.');
                }
            });


            Leads.find({sent: false}).sort('-created').exec(function (err, leads) {
                if (!err) {
                    leads.forEach(function (lead) {
                        sendLeadContactsNotification(app, lead, function (sendLeadContactNotificationErr) {
                            lead.sent = true;
                            logger.error('Error while sending the notification with title - ' + lead._id + lead.name, sendLeadContactNotificationErr);
                            lead.save(function (updateLeadErr) {
                                if (updateLeadErr) {
                                    logger.error('Error while updating the notification with title - ' + lead._id + lead.name, updateLeadErr);
                                }
                            });
                        });
                    });
                } else {
                    logger.error('Error while querying the leads - ', err);
                }
            });
        }

    }, null, true);
};


