'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    request = require('supertest'),
    app = require('../../server'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    //commonUtils=require('../controllers/utils/common.util'),
    commonUserUtil = require('../controllers/utils/common.batch.users.utils'),
    userUtils = require('../controllers/utils/common.users.util'),

    agent = request.agent(app);

/**
 * Globals
 */
var valusers;
var contact;
var regUsers;
var token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0xMC0yM1QwNToxMjoxMS4yNjlaIn0.AbxJ_Ka2cFSwDsrXZGX3MZzLGddiRMZMI32Kf7AMFgA'
/**
 * Unit tests
 */
// describe('...', function(){
//     this.timeout(15000);

//     it('...', function(done){
//       this.timeout(15000);
//       setTimeout(done, 15000);
//     });
//   });
describe('User Model Unit Tests:', function () {
    before(function (done) {
        valusers = [{
            username: '',
            issendotp: true,
            issendemail: true,
            token: token

        }, {
            username: 'somevalue',
            issendotp: true,
            issendemail: true,
            token: token

        }, // }           eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0wOS0wN1QxMjo1OTozOS4yMjVaIn0.KYNyfY_J7BgBTf9ZtkJ0MhsOherAZZ02bYUDeOsBTPM
        {
            username: 'somevalue@nvipani.com',
            issendotp: true,
            issendemail: true,
            token: ''
        }, {
            username: 'somevalue@nvipani.com',
            issendotp: true,
            issendemail: true,
            token: token
        }
            , {
            username: 'somevalue@nvipani.com',
            otp: '',
            password: 's',
            isverifyotp: true
        },
            //{
            //     username:'somevalue@some.com',
            //     otp:'123',
            //     password:'s',
            //     isverifyotp:true
            // },{
            //     username:'somevalue@some.com',
            //     password:'ssssssssss',
            //     issendotp:true
            // }
        ];
        regUsers = [{
            username: 'test1@test.com',
            acceptTerms: true
        }, {
            username: 'test2@test.com',
            password: 'password',
            acceptTerms: true
        }, {
            username: 'test3@test.com',
            password: 'password',
            acceptTerms: true
        }, {
            username: 'test4@test.com',
            password: 'password',
            companyName: 'nVipani',
            acceptTerms: true
        }];
        contact = {
            displayName: 'DisplayName',
            firstName: 'First Name',
            lastName: 'Last Name',
            companyName: 'Company Name',
            phones: [
                {
                    phoneNumber: '0123456789',
                    phoneType: 'Mobile',
                    primary: true
                }
            ],
            emails: [
                {
                    email: 'email@mail.com',
                    emailType: 'Work',
                    primary: true
                }
            ],
            addresses: [
                {
                    addressLine: '23, 5th Cross',
                    city: 'City',
                    state: 'State',
                    country: 'India',
                    pinCode: '560075',
                    addressType: 'Billing',
                    primary: true
                }
            ]
        };
        done();
    });
    /*Case 1: Throw error for blank username*/
    /*Case 2: Throw error for invalid username*/
    /*case 3: Throw error for invalid Authorization */
    /*Case 4: Send otp successfully for valid username and authorization*/
    it('should be able to send Otp only after validating the data', function (done) {

        commonUserUtil.createEachStepUser(valusers[0], 400, agent, function (blankusernameErr, blankusernameRes) {
            should.not.exist(blankusernameErr);
            blankusernameRes.body.message.should.equal('Username (Email/Mobile) field must not be blank');
            commonUserUtil.createEachStepUser(valusers[1], 400, agent, function (validusernameErr, validusernameRes) {
                should.not.exist(validusernameErr);
                validusernameRes.body.status.should.equal(false);
                validusernameRes.body.message.should.equal('Username is not valid, Enter valid Email/Phone');
                commonUserUtil.createEachStepUser(valusers[2], 400, agent, function (blankToken, noToken) {
                    should.not.exist(blankToken);
                    noToken.body.status.should.equal(false);
                    noToken.body.message.should.equal('Ur Not an Authorized User to Create User');
                    commonUserUtil.createEachStepUser(valusers[3], 200, agent, function (sendotpErr, sendotpRes) {
                        should.not.exist(sendotpErr);
                        sendotpRes.body.status.should.equal(true);
                        var otp = sendotpRes.body.otp;
                        sendotpRes.body.message.should.equal('An OTP has been sent to Email :' + valusers[2].username + '. ' + otp + ' is your One Time Password (OTP)');
                        done();

                    });

                });
                // });
            });
        });
    });
    /*
    *  Case 1: it should able to accept any otp -ve test case
    *  Case 2: it should be able to verify otp for non registered user -ve test case
    *  case 3: it should able to accept the generated otp a
    * */

    it('should be able accept the generated OTP and verify the user', function (done) {
        commonUserUtil.createEachStepUser({ username: 'somevalue@nvipani.com', otp: '', password: 'passwrod', isverifyotp: true }, 400, agent, function (presignupotpErr, presignupotpRes) {
            should.not.exist(presignupotpErr);
            presignupotpRes.body.status.should.equal(false);
            presignupotpRes.body.message.should.equal('OTP field is empty for user somevalue@nvipani.com');

            // message: 'OTP field is empty for user somevalue@nvipani.com' },
            // var otp = presignupotpRes.body.otp;
            var otpFalse = 123456;
            commonUserUtil.createEachStepUser({
                username: 'somevalue@nvipani.com', password: 'test1234', conf_password: 'test1234', otp: otpFalse, isverifyotp: true, token: token
            }, 400, agent, function (presignupotpverErr, presignupotpverRes) {
                should.not.exist(presignupotpverErr);
                presignupotpverRes.body.status.should.equal(false);
                presignupotpverRes.body.message.should.equal('Incorrect otp for the Email: somevalue@nvipani.com');

                commonUserUtil.createEachStepUser({ username: 'somevalue@nvipani.com', password: '', conf_password: 'test1234', otp: otpFalse, isverifyotp: true }, 400, agent, function (blankpassErr, blankpassRes) {
                    should.not.exist(blankpassErr);
                    blankpassRes.body.status.should.equal(false);
                    blankpassRes.body.message.should.equal('Password field must not be blank');

                    commonUserUtil.createEachStepUser({ username: 'somevalue@nvipani.com', password: 'test123', conf_password: 'test114', otp: otpFalse, isverifyotp: true }, 400, agent, function (validpassErr, validpassRes) {
                        should.not.exist(validpassErr);
                        validpassRes.body.status.should.equal(false);
                        validpassRes.body.message.should.equal('Password is less than 8 chars');
                        done();
                    });
                });

            });
        });
    });


   

    /* Unable delete user with invalid Id -Ve case*/
    it('should be delete user by id with valid token only', function (done) {
        let data = { id: "5ba35bdd5b70ad2d00615562", token: token }
        commonUserUtil.findId(data, 400, agent, function (err, deluser) {
            should.not.exist(err);
            deluser.body.message.should.equal('Error deleting the user with user id -5ba35bdd5b70ad2d00615562');
            let data1 = { id: "5ba367a8f13009084436c2f1", token: '' }
            commonUserUtil.findId(data1, 401, agent, function (err, deluser) {
                should.not.exist(err);
                deluser.body.message.should.equal('Session Expired or Invalid Token');
                done();
             })
        })
    });

    // it('should be able to send email by taking valid data for reset password request', function (done) {
    //     commonUserUtil.resetPassword({ token: token, id: '', reset_password: false, username: 'emandi1@nvipani.com' }, 400, agent, function (err, result) {
    //         should.not.exist(err);
    //         // console.log(result,'reset password error');
    //         result.body.status.should.equal(false);
    //         done();
    //     })
    // });


    after(function (done) {
        User.deleteOne({ "username": "somevalue@nvipani.com" }).exec();
        // Company.remove().exec();
        // Contact.remove().exec();
        done();
    });
});


