'use strict';
var async = require('async'),
    should = require('should'),
    // commonUtil=require('./common.utils'),
    _this = this,
    manufacturers = [],
    retailers = [],
    users = [],
    distributors = [];
function setDistributors(user) {
    distributors.push(user);
}
function setManufacturers(user) {
    manufacturers.push(user);
}
function setRetailers(user) {
    retailers.push(user);
}
function setUsers(user) {
    users.push(user);
}
exports.getManufacturers = function () {
    return manufacturers;
};
exports.getDistributors = function () {
    return distributors;
};
exports.getRetailers = function () {
    return retailers;
};
exports.getSelectedUser = function (username) {
    return _this.getAllUsers().filter(function (eachUser) {
        return eachUser.username === username;
    });
};
exports.getAllUsers = function () {
    return users;
};
function matchedCategories(selectedCategories, categories, isOtherSegments) {
    var finalSelectedcategories = [];

    if (selectedCategories) {
        selectedCategories.forEach(function (eachSelectedCategory) {
            if (isOtherSegments) {
                var matchedSegmentValue = categories.filter(function (eachCategory) {
                    return eachSelectedCategory.toLowerCase() === eachCategory.name.toLowerCase();
                });
                if (matchedSegmentValue.length > 0)
                    finalSelectedcategories.push({ category: matchedSegmentValue[0]._id });
            } else {
                finalSelectedcategories.push({ category: eachSelectedCategory.category._id });
            }
        });

    }
    return finalSelectedcategories;

}
function getSelectedSegmentDetails(eachBatchUser, done) {
    var segments = [];
    eachBatchUser.selectedSegments.forEach(function (selSeg) {
        var matchedSegmentValue = eachBatchUser.segments.filter(function (eachSegment) {
            return selSeg === eachSegment.name;
        });
        if (matchedSegmentValue[0].isSpecific) {

            segments.push({
                segment: matchedSegmentValue[0]._id,
                categories: matchedCategories(eachBatchUser.selectedCategories, eachBatchUser.categories, true)
            });

        } else {

            segments.push({
                segment: matchedSegmentValue[0]._id,
                categories: matchedCategories(matchedSegmentValue[0].categories, eachBatchUser.categories, false)
            });

        }
    });
    done(segments);
}
function createUser(eachBatchUser, agent, done) {
    agent.post('/user/sendpresignupotp')
        .send({ username: eachBatchUser.username, password: 'password', issendotp: true })
        .expect(200)
        .end(function (eachBatchPasswordErr, eachBatchPasswordRes) {
            if (eachBatchPasswordErr) done(eachBatchPasswordErr, null);
            else {
                if (eachBatchPasswordRes.body.user.status === 'Register Request') {
                    (eachBatchPasswordRes.body.user.status).should.equal('Register Request');

                    if (eachBatchPasswordRes.body.user.otp) {
                        eachBatchUser.otp = eachBatchPasswordRes.body.user.otp;
                    }
                    if (eachBatchPasswordRes.body.user.emailOtp) {
                        eachBatchUser.otp = eachBatchPasswordRes.body.user.emailOtp;
                    }
                    eachBatchUser.isverifyotp = true;
                    eachBatchUser.issendotp = false;
                    agent.post('/user/sendpresignupotp')
                        .send(eachBatchUser)
                        .expect(200)
                        .end(function (verifiedBatchUserOtpErr, verifiedBatchUserOtpFirstUser) {
                            if (verifiedBatchUserOtpErr) done(verifiedBatchUserOtpErr, null);

                            (verifiedBatchUserOtpFirstUser.body.user.status).should.equal('Verified');

                            eachBatchUser.registrationCategories = verifiedBatchUserOtpFirstUser.body.registrationCategories;
                            eachBatchUser.segments = verifiedBatchUserOtpFirstUser.body.segments;
                            eachBatchUser.categories = verifiedBatchUserOtpFirstUser.body.categories;

                            var registrationCategoryName = eachBatchUser.registrationCategory;
                            eachBatchUser.registrationCategories.forEach(function (item, index) {
                                if (eachBatchUser.registrationCategory === item.name) {
                                    eachBatchUser.registrationCategory = item._id;
                                }
                            });
                            // set the selected segments and categories for each segments
                            /* if(eachBatchUser.selectedSegments) {
                                 eachBatchUser.segments.forEach(function (item, index) {
                                     eachBatchUser.selectedSegments.forEach(function (selSeg, ix) {
                                         if (selSeg === item.name) {
                                             selectedSegments.push({
                                                 segment: eachBatchUser.selectedSegments._id,
                                                 categories:
                                             });
                                         }
                                     });
                                 });
                             }*/
                            getSelectedSegmentDetails(eachBatchUser, function (segments) {
                                agent.post('/user/sendpresignupotp')
                                    .send({
                                        username: eachBatchUser.username,
                                        companyName: eachBatchUser.companyName,
                                        registrationCategory: eachBatchUser.registrationCategory,
                                        ispassword: true,
                                        selectedSegments: segments
                                    })
                                    .expect(200)
                                    .end(function (sendBusinessSegmentBatchUserErr, sendBusinessSegmentBatchUser) {
                                        if (sendBusinessSegmentBatchUserErr) done(sendBusinessSegmentBatchUserErr, null);
                                        sendBusinessSegmentBatchUser.body.status.should.equal(true);
                                        sendBusinessSegmentBatchUser.body.message.should.equal('User is successfully registered');
                                        sendBusinessSegmentBatchUser.body.user.status.should.equal('Registered');
                                        var user = sendBusinessSegmentBatchUser.body.user;
                                        user.password = 'password';
                                        setUsers(user);
                                        if (registrationCategoryName === 'Retailer') {
                                            setRetailers(user);
                                        } else if (registrationCategoryName === 'Distributor') {
                                            setDistributors(user);
                                        } else if (registrationCategoryName === 'Manufacturer') {
                                            setManufacturers(user);
                                        }
                                        done(null, user);

                                    });
                            });
                        });
                }
            }
        });

}
exports.batchCreate = function (users, agent, done) {
    async.forEachSeries(users, function (eachBatchUser, callback) {
        createUser(eachBatchUser, agent, function (userErr, user) {
            if (userErr) {
                callback(userErr);
            } else {
                callback();
            }

        });
    }, function (err) {
        done(err);
    });

};
exports.createUser = function (user, agent, done) {
    createUser(user, agent, function (userErr, user) {
        done(userErr, user);
    });

};
exports.createEachStepUser = function (user, serverRes, agent, done) {
    agent.post('/user/userRegistration')
        .send(user)
        .expect(serverRes)
        .end(function (signinErr, signinRes) {
            // Handle signin error
            done(signinErr, signinRes);
        });
};
exports.createContactUser = function (contact, agent, done) {
    // this will work only if the contact is having single email or phone number.
    if (contact.nVipaniUser) {
        done(null, contact.nVipaniUser);
    } else if (contact.emails.length > 0) {
        createUser({
            username: contact.emails[0].email, password: 'password', 'registrationCategory': 'Retailer',
            'selectedSegments': ['Other'],
            'categories': ['COFFE']
        }, agent, function (userErr, user) {
            done(userErr, user);
        });

    } else if (contact.phones.length > 0) {
        ({
            username: contact.phones[0].phoneNumber, password: 'password', 'registrationCategory': 'Retailer',
            'selectedSegments': ['Other'],
            'categories': ['COFFE']
        }, agent, function (userErr, user) {
            done(userErr, user);
        });
    }

};
exports.getUser = function (user, agent, done) {
    agent.post('/auth/signin')
        .send(user)
        .expect(200)
        .end(function (signinErr, signinRes) {
            // Handle signin error
            done(signinErr, signinRes);
        });

};

exports.findId = function (id, serverRes, agent, done) {
    agent.delete(`/users/deleteuser/:${id}`).
        set('token', 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0wOS0xNFQwNjoxNjoyMy45OTRaIn0.DTwvg1okcbm6PqqwUFeSSqkEvos1jBQMFuBz0LwybdE').
        send()
        .expect(serverRes).
        end(function (err, result) {
            done(err, result)
        });
};

exports.resetPassword = function (data, serverRes, agent, done) {
    agent.post('/users/resetPasswordRequest')
        .send(data)
        .expect(serverRes)
        .end(function (reseterr, resetPassword) {
            done(reseterr, resetPassword)
        })
}




