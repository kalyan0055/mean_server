'use strict';
var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    //Contact = mongoose.model('Contact'),
    async = require('async'),
    //Offer = mongoose.model('Offer'),
   // Order = mongoose.model('Order'),
   // Notification = mongoose.model('Notification'),
    fs = require('fs');

/**
 * Module dependencies.
 */



exports.getQueryByUser=function (query,done) {
    User.findOne({
        username: query,
        status: 'Registered',
        deleted:false,
        disabled:false
    }, '-salt -password', function (fetchUserError, fetchedUser) {
        done(fetchUserError,fetchedUser);
    });

};
exports.getQueryByUser=function (query,populateLevel,done) {
    if(populateLevel===0) {
        User.findOne(query, '-salt -password', function (fetchUserError, fetchedUser) {
            done(fetchUserError, fetchedUser);
        });
    }else if(populateLevel===1){
        User.findOne(query).select('username email mobile emailVerified mobileVerified otp emailOtp company status').populate('company', 'categories segments registrationCategory').exec( function (fetchUserError, fetchedUser) {
            done(fetchUserError, fetchedUser);
        });
    }else if(populateLevel===2){
        User.findOne(query, '-salt -password', function (fetchUserError, fetchedUser) {
            done(fetchUserError, fetchedUser);
        });
    }else if(populateLevel===3){
        User.findOne(query, '-salt -password', function (fetchUserError, fetchedUser) {
            done(fetchUserError, fetchedUser);
        });
    }else if(populateLevel===4){
        User.findOne(query).select('username email mobile emailVerified mobileVerified otp emailOtp company status').populate('company').exec( function (fetchUserError, fetchedUser) {
            done(fetchUserError, fetchedUser);
        });
    }else{
        User.findOne(query, '-salt -password', function (fetchUserError, fetchedUser) {
            done(fetchUserError, fetchedUser);
        });
    }


};
exports.updateContactWithnVipaniUser = function (user, done) {
    Contact.find({
        $and: [
            {nVipaniUser: null},
            {$or: [{'emails.email': user.username}, {'phones.phoneNumber': user.username}]}
        ]
    }).sort('-created').exec(function (contactsFindErr, contacts) {
        if (contactsFindErr) {
            done(contactsFindErr);
        } else {
            if (contacts && contacts.length > 0) {
                async.each(contacts, function (eachContact, callback) {
                    eachContact.nVipaniUser = user;
                    eachContact.nVipaniCompany = user.company;
                    eachContact.save(function (contactSaveErr) {
                        if (contactSaveErr) {
                            callback(contactSaveErr);
                        } else {
                            async.series([
                                    function (seriesCallback) {
                                        // Update Orders - Buyer
                                        Order.update({'buyer.contact': eachContact},
                                            {'$set': {'buyer.nVipaniUser': eachContact.nVipaniUser,'buyer.nVipaniCompany': eachContact.nVipaniCompany}}, {multi: true}, function (updateErr, numberAffected, rawResponse) {
                                                if (updateErr) {
                                                    /*logger.error('Error while updating the Order\'s buyer nVipani User -' + updateErr);*/
                                                    seriesCallback(updateErr, '1');
                                                } else {
                                                    /*  logger.debug(numberAffected + ' Orders updated with nVipaniUser of buyer for the contact -' + JSON.stringify(eachContact));
                                                     */
                                                    seriesCallback(null, '1');
                                                }
                                            });
                                    },
                                    function (seriesCallback) {
                                        // Update Orders - Seller
                                        Order.update({'seller.contact': eachContact},
                                            {'$set': {'seller.nVipaniUser': eachContact.nVipaniUser,'seller.nVipaniCompany': eachContact.nVipaniCompany}}, {multi: true}, function (updateErr, numberAffected, rawResponse) {
                                                if (updateErr) {
                                                    /*   logger.error('Error while updating the Order\'s seller nVipani User -' + updateErr);
                                                    */
                                                    seriesCallback(updateErr, '2');
                                                } else {
                                                    /* logger.debug(numberAffected + ' Orders updated with nVipaniUser of seller for the contact -' + JSON.stringify(eachContact));
                                                     */
                                                    seriesCallback(null, '2');
                                                }
                                            });

                                    },
                                    function (seriesCallback) {
                                        // Update Orders - Mediator
                                        Order.update({'mediator.contact': eachContact},
                                            {'$set': {'mediator.nVipaniUser': eachContact.nVipaniUser,'mediator.nVipaniCompany': eachContact.nVipaniCompany}}, {multi: true}, function (updateErr, numberAffected, rawResponse) {
                                                if (updateErr) {
                                                    /* logger.error('Error while updating the Order\'s mediator nVipani User -' + updateErr);
                                                    */
                                                    seriesCallback(updateErr, '3');
                                                } else {
                                                    /* logger.debug(numberAffected + ' Orders updated with nVipaniUser of mediator for the contact -' + JSON.stringify(eachContact));
                                                    */
                                                    seriesCallback(null, '3');
                                                }
                                            });
                                    },
                                    function (seriesCallback) {
                                        // Update Offers
                                        Offer.update({'notificationsContacts.contact': eachContact},
                                            {'$set': {'notificationsContacts.$.nVipaniUser': eachContact.nVipaniUser,'notificationsContacts.$.nVipaniCompany': eachContact.nVipaniCompany}}, {multi: true}, function (updateErr, numberAffected, rawResponse) {
                                                if (updateErr) {
                                                    /*   logger.error('Error while updating the Offer\'s  nVipani User -' + updateErr);
                                                     */
                                                    seriesCallback(updateErr, '4');
                                                } else {
                                                    /*logger.debug(numberAffected + ' Offers updated with nVipaniUser for the contact -' + JSON.stringify(eachContact));
                                                    */
                                                    seriesCallback(null, '4');
                                                }
                                            });
                                    },
                                    function (seriesCallback) {
                                        // Update Notifications
                                        Notification.update({'target.contact': eachContact},
                                            {'$set': {'target.nVipaniUser': eachContact.nVipaniUser,'target.nVipaniCompany': eachContact.nVipaniCompany}}, {multi: true}, function (updateErr, numberAffected, rawResponse) {
                                                if (updateErr) {
                                                    /* logger.error('Error while updating the Notification nVipani User -' + updateErr);
                                                    */
                                                    seriesCallback(updateErr, '5');
                                                } else {
                                                    /*logger.debug(numberAffected + ' Notifications updated with nVipaniUser for the contact -' + JSON.stringify(eachContact));
                                                    */
                                                    seriesCallback(null, '5');
                                                }
                                            });
                                    }
                                ],
                                // optional callback
                                function (seriesErr, results) {
                                    // results is now equal to ['1', '2','3','4','5']

                                    if (seriesErr) {
                                        callback(seriesErr);
                                    } else {
                                        callback();
                                    }

                                });
                        }
                    });
                }, function (err) {
                    if (err) {
                        done(err);
                    } else {
                        done();
                    }
                });
            } else {
                done();
            }
        }
    });
};
