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
    commonUserUtil=require('../controllers/utils/common.batch.users.utils'),
     
    agent = request.agent(app);
  
/**
 * Globals
 */
var valusers;
var contact;
var regUsers;
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
describe('User Model Unit Tests:', function() {
     before(function(done) {
        valusers = [{
            username:'',
            issendotp:true,
            issendemail:true,
        },{
            username:'somevalue',
            issendotp:true,
            issendemail:true,
        },{
            username:'somevalue@some.com',
            issendotp:true,
            issendemail:true,
            token:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0wOS0wN1QxMjo1OTozOS4yMjVaIn0.KYNyfY_J7BgBTf9ZtkJ0MhsOherAZZ02bYUDeOsBTPM'
         } // }           eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0wOS0wN1QxMjo1OTozOS4yMjVaIn0.KYNyfY_J7BgBTf9ZtkJ0MhsOherAZZ02bYUDeOsBTPM
        ,{
            username:'somevalue@some.com',
            otp:'',
            password:'s',
            isverifyotp:true
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
        },{
            username: 'test2@test.com',
            password: 'password',
            acceptTerms: true
        },{
            username: 'test3@test.com',
            password: 'password',
            acceptTerms: true
        },{
            username: 'test4@test.com',
            password: 'password',
            companyName: 'nVipani',
            acceptTerms: true
        }];
        contact = {
            displayName:'DisplayName',
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
    /*Case 2: Trow error for blank password*/
    /*case 3: Throw error for invalid username*/
    /*case 4: Throw error for invalid password*/
    /*Case 5: Send otp successfully for valid username and password*/
    it('should be able to send Otp only after validating the data', function(done){
      
        commonUserUtil.createEachStepUser(valusers[0],400,agent,function (blankusernameErr, blankusernameRes) {
            should.not.exist(blankusernameErr);
            blankusernameRes.body.message.should.equal('Username (Email/Mobile) field must not be blank');
            commonUserUtil.createEachStepUser(valusers[1],400,agent,function (validusernameErr, validusernameRes) {
                should.not.exist(validusernameErr);
                validusernameRes.body.status.should.equal(false);
                validusernameRes.body.message.should.equal('Username is not valid, Enter valid Email/Phone');
                // done();
                // commonUserUtil.createEachStepUser(valusers[2],400,agent,function (blankpassErr, blankpassRes) {
                //     should.not.exist(blankpassErr);
                //     blankpassRes.body.status.should.equal(false);
                //     blankpassRes.body.message.should.equal('Password field must not be blank for the user :'+ valusers[2].username);
                //     commonUserUtil.createEachStepUser(valusers[3],400,agent,function (validpassErr, validpassRes) {
                //         should.not.exist(validpassErr);
                //         validpassRes.body.status.should.equal(false);
                //         validpassRes.body.message.should.equal('Password is less than 8 chars');
                        commonUserUtil.createEachStepUser(valusers[2],200,agent,function (sendotpErr, sendotpRes) {
 
                            should.not.exist(sendotpErr);
                            sendotpRes.body.status.should.equal(true);
                            var otp = sendotpRes.body.otp;
                            sendotpRes.body.message.should.equal('An OTP has been sent to Email :' + valusers[2].username + '. ' + otp + ' is your One Time Password (OTP)');
                           done();
                          
                        });
                //     });
                // });
            });
        });
    });
    /*
    *  Case 1: it should able to accept any otp -ve test case
    *  Case 2: it should be able to verify otp for non registered user -ve test case
    *  case 3: it should able to accept the generated otp and populate categories and segments +ve test case
    * */
   
   it('should be able accept the generated OTP and verify the user', function(done){
        commonUserUtil.createEachStepUser({username:'adminuser5@nvipani.com',otp:'',password:'passwrod',isverifyotp:true},400,agent,function(presignupotpErr, presignupotpRes){         
            should.not.exist(presignupotpErr);
            presignupotpRes.body.status.should.equal(false);
            presignupotpRes.body.message.should.equal('OTP field is empty for user adminuser5@nvipani.com');
            // message: 'OTP field is empty for user adminuser5@nvipani.com' },
            // var otp = presignupotpRes.body.otp;
             var otpFalse = 123456;
           
            commonUserUtil.createEachStepUser({username:'adminuser5@nvipani.com',password:'test1234',conf_password:'test1234',otp:otpFalse,isverifyotp:true},400,agent,function(presignupotpverErr, presignupotpverRes){
                should.not.exist(presignupotpverErr);
                presignupotpverRes.body.status.should.equal(false);
                presignupotpverRes.body.message.should.equal('Incorrect otp for the Email: adminuser5@nvipani.com');
               
                commonUserUtil.createEachStepUser({username:'adminuser5@nvipani.com',password:'',conf_password:'test1234',otp:otpFalse,isverifyotp:true},400,agent,function (blankpassErr, blankpassRes) {
                    should.not.exist(blankpassErr);
                    blankpassRes.body.status.should.equal(false);
                    blankpassRes.body.message.should.equal('Password field must not be blank');
                    
                    commonUserUtil.createEachStepUser({username:'adminuser5@nvipani.com',password:'test123',conf_password:'test114',otp:otpFalse,isverifyotp:true},400,agent,function (validpassErr, validpassRes) {
                        should.not.exist(validpassErr);
                        validpassRes.body.status.should.equal(false);
                        validpassRes.body.message.should.equal('Password is less than 8 chars');
                        //  commonUserUtil.createEachStepUser({username:'adminuser6@nvipani.com',password:'test1234',conf_password:'test1234',otp:'498490',isverifyotp:true},200,agent,function (sendotpErr, sendotpRes) {
                        //     console.log(sendotpErr,'otperr');
                        //     console.log(sendotpRes.body.user.emailOtp,'body');                          
                        //     should.not.exist(sendotpErr);
                        //     sendotpRes.body.status.should.equal(true);
                        //     var otp = sendotpRes.body.emailOtp;
                        //     sendotpRes.body.message.should.equal('An OTP has been sent to Email :' + 'adminuser6@nvipani.com' + '. ' + otp + ' is your One Time Password (OTP)');
                           done();
                          
                       // });
                    });
                });

                  
                // commonUserUtil.createEachStepUser({username:'test1@test.com',otp:otp,isverifyotp:true},200,agent,function(presignupotpverifiedErr, presignupotpverifiedRes){
                //     should.not.exist(presignupotpverifiedErr);
                //     presignupotpverifiedRes.body.status.should.equal(true);
                //     presignupotpverifiedRes.body.message.should.equal('User is verified :test1@test.com');
                //     if(presignupotpverifiedRes.body.registrationCategories){
                //         if(presignupotpverifiedRes.body.segments){
                //             done();
                //         }
                //     }
                // });
            });
        });
   });

    /*
    * Case 1:Show information for not registered user -ve test case;
    * case 2:Register without category -ve test case;
    * case 3:Register without business segments -ve test case;
    * Case 4:Register with already registered company -ve test case;
    * Case 5:Register with new company name +ve test case;
    * */
 //   it('should register the user with new company name', function(done){
        // commonUserUtil.createEachStepUser({username:'test2@test.com',password:'password',isverifyotp:true,otp:123456},400,agent,function (presignupErr,presignupRes) {
        //     should.not.exist(presignupErr);
        //     presignupRes.body.status.should.equal(false);
        //     presignupRes.body.message.should.equal('User is not registered properly');
        //     commonUserUtil.createEachStepUser({username:'test2@test.com',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //         should.not.exist(presendotpErr);
        //         presendotpRes.body.status.should.equal(true);
        //         var otp = presendotpRes.body.otp;
        //         presendotpRes.body.message.should.equal('An OTP has been sent to Email :test2@test.com. ' +otp + ' is your One Time Password (OTP)');
        //         commonUserUtil.createEachStepUser({username:'test2@test.com',password:'password',isverifyotp:true,otp:otp},200,agent,function (verifyotpErr, verifyotpRes) {
        //             should.not.exist(verifyotpErr);
        //             verifyotpRes.body.status.should.equal(true);
        //             verifyotpRes.body.message.should.equal('User is verified :test2@test.com');
        //             var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //             var segments = [{segment:verifyotpRes.body.segments[0]._id,categories:[{category:verifyotpRes.body.categories[0]._id}]}];
        //             commonUserUtil.createEachStepUser({username:'test2@test.com',password:'password',ispassword:true},400,agent,function (verifyuserErr, verifyuserRes) {
        //                 should.not.exist(verifyuserErr);
        //                 verifyuserRes.body.status.should.equal(false);
        //                 verifyuserRes.body.message.should.equal('No registration category found for the user :test2@test.com');
        //                 commonUserUtil.createEachStepUser({username:'test2@test.com',password:'password',ispassword:true,registrationCategory:registrationCategory},400,agent,function (verifyusercatErr, verifyusercatRes) {
        //                     should.not.exist(verifyusercatErr);
        //                     verifyusercatRes.body.status.should.equal(false);
        //                     verifyusercatRes.body.message.should.equal('No segments found for the user :test2@test.com');
        //                     commonUserUtil.createEachStepUser({username:'test2@test.com',password:'password',ispassword:true,registrationCategory:registrationCategory,selectedSegments:segments,companyName:'sample'},200,agent,function(verifiedErr, verifiedRes){
        //                         should.not.exist(verifiedErr);
        //                         verifiedRes.body.status.should.equal(true);
        //                         verifiedRes.body.message.should.equal('User is successfully registered');
        //                         commonUserUtil.createEachStepUser({username:'test3@test.com',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //                             should.not.exist(presendotpErr);
        //                             presendotpRes.body.status.should.equal(true);
        //                             var otp = presendotpRes.body.otp;
        //                             presendotpRes.body.message.should.equal('An OTP has been sent to Email :test3@test.com. ' + otp + ' is your One Time Password (OTP)');
        //                             commonUserUtil.createEachStepUser({
        //                                 username: 'test3@test.com',
        //                                 password: 'password',
        //                                 isverifyotp: true,
        //                                 otp: otp
        //                             }, 200, agent, function (verifyotpErr, verifyotpRes) {
        //                                 should.not.exist(verifyotpErr);
        //                                 verifyotpRes.body.status.should.equal(true);
        //                                 verifyotpRes.body.message.should.equal('User is verified :test3@test.com');
        //                                 var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //                                 var segments = [{
        //                                     segment: verifyotpRes.body.segments[0]._id,
        //                                     categories: [{category: verifyotpRes.body.categories[0]._id}]
        //                                 }];
        //                                 commonUserUtil.createEachStepUser({
        //                                     username: 'test3@test.com',
        //                                     password: 'password',
        //                                     ispassword: true,
        //                                     registrationCategory: registrationCategory,
        //                                     selectedSegments: segments,
        //                                     companyName: 'sample'
        //                                 }, 400, agent, function (verifiedErr, verifiedRes) {
        //                                     should.not.exist(verifiedErr);
        //                                     verifiedRes.body.status.should.equal(false);
        //                                     verifiedRes.body.message.should.equal('Someone has already registered with the company name - sample. Please contact info@invipani.com');
        //                                     commonUserUtil.createEachStepUser({
        //                                         username: 'test3@test.com',
        //                                         password: 'password',
        //                                         ispassword: true,
        //                                         registrationCategory: registrationCategory,
        //                                         selectedSegments: segments,
        //                                         companyName: 'sample1'
        //                                     }, 200, agent, function (verifiedErr, verifiedRes) {
        //                                         should.not.exist(verifiedErr);
        //                                         verifiedRes.body.status.should.equal(true);
        //                                         verifiedRes.body.message.should.equal('User is successfully registered');
        //                                         done();
        //                                     });
        //                                 });
        //                             });
        //                         });
        //                     });
        //                 });
        //             });
        //         });
        //     });
        // });
  //  });
    /*Case 1: it should set the nvipani user for registered user if it is already in a customer list */
 //   it('should set the nvipani user for a registered user if it is in a contact list', function (done) {
        // commonUserUtil.createEachStepUser({username:'test10@test.com',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //     should.not.exist(presendotpErr);
        //     presendotpRes.body.status.should.equal(true);
        //     var otp = presendotpRes.body.otp;
        //     presendotpRes.body.message.should.equal('An OTP has been sent to Email :test10@test.com. ' + otp + ' is your One Time Password (OTP)');
        //     commonUserUtil.createEachStepUser({
        //         username: 'test10@test.com',
        //         password: 'password',
        //         isverifyotp: true,
        //         otp: otp
        //     }, 200, agent, function (verifyotpErr, verifyotpRes) {
        //         should.not.exist(verifyotpErr);
        //         verifyotpRes.body.status.should.equal(true);
        //         verifyotpRes.body.message.should.equal('User is verified :test10@test.com');
        //         var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //         var segments = [{
        //             segment: verifyotpRes.body.segments[0]._id,
        //             categories: [{category: verifyotpRes.body.categories[0]._id}]
        //         }];
        //         commonUserUtil.createEachStepUser({username:'test10@test.com',password:'password',ispassword:true,registrationCategory:registrationCategory,selectedSegments:segments,companyName:'samplenVipani'},200,agent,function(verifiedErr, verifiedRes) {
        //             should.not.exist(verifiedErr);
        //             verifiedRes.body.status.should.equal(true);
        //             verifiedRes.body.message.should.equal('User is successfully registered');
        //             commonUserUtil.getUser({username: 'test10@test.com', password:'password'},agent,function(signinuserErr, signinuserRes){
        //                 should.not.exist(signinuserErr);
        //                 signinuserRes.body.status.should.equal(true);
        //                 var token = signinuserRes.body.token;
        //                 agent.post('/contacts')
        //                     .send(contact)
        //                     .set('token', token)
        //                     .expect(200)
        //                     .end(function (contactSaveErr, contactSaveRes) {
        //                         // Handle Contact save error
        //                         should.not.exist(contactSaveErr);
        //                         agent.get('/contacts')
        //                             .set('token', token)
        //                             .end(function (contactsGetErr, contactsGetRes){
        //                                 should.not.exist(contactsGetErr);
        //                                 var contacts = contactsGetRes.body;
        //                                 contacts.length.should.equal(2);
        //                                 contacts[1].emails.length.should.equal(1);
        //                                 contacts[1].displayName.should.match('test10@test.com');
        //                                 contacts[1].emails[0].email.should.match('test10@test.com');
        //                                 contacts[1].phones.length.should.equal(0);
        //                                 contacts[1].nVipaniRegContact.should.match(true);
        //                                 contacts[0].nVipaniRegContact.should.match(false);
        //                                 // Set assertions
        //                                 (contacts[0].firstName).should.match('First Name');
        //                                 (contacts[0].lastName).should.match('Last Name');
        //                                 (contacts[0].companyName).should.match('Company Name');

        //                                 (contacts[0].phones[0].phoneNumber).should.match('0123456789');
        //                                 (contacts[0].phones[0].phoneType).should.match('Mobile');
        //                                 (contacts[0].phones[0].primary).should.match(true);

        //                                 (contacts[0].emails[0].email).should.match('email@mail.com');
        //                                 (contacts[0].emails[0].emailType).should.match('Work');
        //                                 (contacts[0].emails[0].primary).should.match(true);


        //                                 (contacts[0].addresses[0].addressLine).should.match('23, 5th Cross');
        //                                 (contacts[0].addresses[0].city).should.match('City');
        //                                 (contacts[0].addresses[0].state).should.match('State');
        //                                 (contacts[0].addresses[0].country).should.match('India');
        //                                 (contacts[0].addresses[0].pinCode).should.match('560075');
        //                                 (contacts[0].addresses[0].addressType).should.match('Billing');
        //                                 (contacts[0].addresses[0].primary).should.match(true);
        //                                 commonUserUtil.createEachStepUser({username:'email@mail.com',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //                                     should.not.exist(presendotpErr);
        //                                     presendotpRes.body.status.should.equal(true);
        //                                     var otp = presendotpRes.body.otp;
        //                                     presendotpRes.body.message.should.equal('An OTP has been sent to Email :email@mail.com. ' + otp + ' is your One Time Password (OTP)');
        //                                     commonUserUtil.createEachStepUser({
        //                                         username: 'email@mail.com',
        //                                         password: 'password',
        //                                         isverifyotp: true,
        //                                         otp: otp
        //                                     }, 200, agent, function (verifyotpErr, verifyotpRes) {
        //                                         should.not.exist(verifyotpErr);
        //                                         verifyotpRes.body.status.should.equal(true);
        //                                         verifyotpRes.body.message.should.equal('User is verified :email@mail.com');
        //                                         var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //                                         var segments = [{
        //                                             segment: verifyotpRes.body.segments[0]._id,
        //                                             categories: [{category: verifyotpRes.body.categories[0]._id}]
        //                                         }];
        //                                         commonUserUtil.createEachStepUser({
        //                                             username: 'email@mail.com',
        //                                             password: 'password',
        //                                             ispassword: true,
        //                                             registrationCategory: registrationCategory,
        //                                             selectedSegments: segments,
        //                                             companyName: 'sample2'
        //                                         }, 200, agent, function (verifiedErr, verifiedRes) {
        //                                             should.not.exist(verifiedErr);
        //                                             verifiedRes.body.status.should.equal(true);
        //                                             verifiedRes.body.message.should.equal('User is successfully registered');
        //                                             agent.get('/contacts')
        //                                                 .set('token', token)
        //                                                 .end(function (contactsGetErr, contactsGetRes) {
        //                                                     should.not.exist(contactsGetErr);
        //                                                     contacts = contactsGetRes.body;
        //                                                     should.exist(contacts[0].nVipaniUser);
        //                                                     contacts[0].nVipaniUser.should.equal(verifiedRes.body.user._id);
        //                                                     done();
        //                                                 });

        //                                         });
        //                                     });
        //                                 });
        //                             });

        //                     });

        //             });
        //         });
        //     });
        // });
  //  });

    /**
     * case 1:Register the user with new company and check payment terms as part of company
     * case 2:Register one more user and compare payment terms with old user
     * case 3:Check one payment term using payment id that is in company payment terms
     */
  //  it('Should register the user and check payment terms as part of company',function (done) {
        // commonUserUtil.createEachStepUser({username:'paymentTerms@test.com',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //     should.not.exist(presendotpErr);
        //     presendotpRes.body.status.should.equal(true);
        //     var otp = presendotpRes.body.otp;
        //     presendotpRes.body.message.should.equal('An OTP has been sent to Email :paymentTerms@test.com. ' + otp + ' is your One Time Password (OTP)');
        //     commonUserUtil.createEachStepUser({
        //         username: 'paymentTerms@test.com',
        //         password: 'password',
        //         isverifyotp: true,
        //         otp: otp
        //     }, 200, agent, function (verifyotpErr, verifyotpRes) {
        //         should.not.exist(verifyotpErr);
        //         verifyotpRes.body.status.should.equal(true);
        //         verifyotpRes.body.message.should.equal('User is verified :paymentTerms@test.com');
        //         var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //         var segments = [{
        //             segment: verifyotpRes.body.segments[0]._id,
        //             categories: [{category: verifyotpRes.body.categories[0]._id}]
        //         }];
        //         commonUserUtil.createEachStepUser({
        //             username: 'paymentTerms@test.com',
        //             password: 'password',
        //             ispassword: true,
        //             registrationCategory: registrationCategory,
        //             selectedSegments: segments,
        //             companyName: 'paymentTerms'
        //         }, 200, agent, function (verifiedErr, verifiedRes) {
        //             should.not.exist(verifiedErr);
        //             verifiedRes.body.status.should.equal(true);
        //             verifiedRes.body.message.should.equal('User is successfully registered');
        //             var user=verifiedRes.body.user;
        //             agent.get('/companies/' + user.company.toString())
        //                 .expect(200)
        //                 .end(function (companyErr, companyRes) {
        //                     should.not.exist(companyErr);
        //                     should.exist(companyRes);
        //                     var company=companyRes.body;
        //                     should.exist(company.settings.paymentTerms);
        //                     company.settings.paymentTerms.length.should.equal(10);
        //                     //register another user
        //                     commonUserUtil.createEachStepUser({username:'paymentTerms1@test.com',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //                         should.not.exist(presendotpErr);
        //                         presendotpRes.body.status.should.equal(true);
        //                         var otp = presendotpRes.body.otp;
        //                         presendotpRes.body.message.should.equal('An OTP has been sent to Email :paymentTerms1@test.com. ' + otp + ' is your One Time Password (OTP)');
        //                         commonUserUtil.createEachStepUser({
        //                             username: 'paymentTerms1@test.com',
        //                             password: 'password',
        //                             isverifyotp: true,
        //                             otp: otp
        //                         }, 200, agent, function (verifyotpErr, verifyotpRes) {
        //                             should.not.exist(verifyotpErr);
        //                             verifyotpRes.body.status.should.equal(true);
        //                             verifyotpRes.body.message.should.equal('User is verified :paymentTerms1@test.com');
        //                             var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //                             var segments = [{
        //                                 segment: verifyotpRes.body.segments[0]._id,
        //                                 categories: [{category: verifyotpRes.body.categories[0]._id}]
        //                             }];
        //                             commonUserUtil.createEachStepUser({
        //                                 username: 'paymentTerms1@test.com',
        //                                 password: 'password',
        //                                 ispassword: true,
        //                                 registrationCategory: registrationCategory,
        //                                 selectedSegments: segments,
        //                                 companyName: 'paymentTerms1'
        //                             }, 200, agent, function (verifiedErr, verifiedRes) {
        //                                 should.not.exist(verifiedErr);
        //                                 verifiedRes.body.status.should.equal(true);
        //                                 verifiedRes.body.message.should.equal('User is successfully registered');
        //                                 var user1=verifiedRes.body.user;
        //                                 agent.get('/companies/' + user1.company.toString())
        //                                     .expect(200)
        //                                     .end(function (companyErr, companyRes) {
        //                                         should.not.exist(companyErr);
        //                                         should.exist(companyRes);
        //                                         var company1=companyRes.body;
        //                                         should.exist(company1.settings.paymentTerms);
        //                                         company1.settings.paymentTerms.length.should.equal(10);
        //                                         company1.settings.paymentTerms.length.should.equal(company.settings.paymentTerms.length);
        //                                         agent.post('/auth/signin')
        //                                             .send({username:'paymentTerms1@test.com',password:'password'})
        //                                             .expect(200)
        //                                             .end(function (signinErr, signinRes) {
        //                                                 should.not.exist(signinErr);
        //                                                 should.exist(signinRes.body.token);
        //                                                 // Get the token
        //                                                 var token = signinRes.body.token;
        //                                                 agent.get('/paymentterms/' + company1.settings.paymentTerms[0].paymentTerm)
        //                                                     .set('token', token)
        //                                                     .expect(200)
        //                                                     .end(function (paymentTermErr, paymentTermRes) {
        //                                                         should.not.exist(paymentTermErr);
        //                                                         should.exist(paymentTermRes);
        //                                                         should.exist(paymentTermRes.body.name);
        //                                                         done();
        //                                                     });
        //                                             });

        //                                     });
        //                             });
        //                         });
        //                     });
        //                 });
        //         });
        //     });
        // });
  //  });

    /**
     * Case 1 :Register user with email
     * Case 2 :Check forgot password
     *    Case 2.1 : Send OTP for change password
     *    Case 2.2 : Verify OTP for Change Password
     *    Case 2.3 : Change Password
     *
     *
     */
 //   it('Should check forgot password',function (done) {


 //   });

 //   it('Should register the user with same company name using different users',function (done) {
        // commonUserUtil.createEachStepUser({username:'retailer@test.com',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //     should.not.exist(presendotpErr);
        //     presendotpRes.body.status.should.equal(true);
        //     var otp = presendotpRes.body.otp;
        //     presendotpRes.body.message.should.equal('An OTP has been sent to Email :retailer@test.com. ' + otp + ' is your One Time Password (OTP)');
        //     commonUserUtil.createEachStepUser({
        //         username: 'retailer@test.com',
        //         password: 'password',
        //         isverifyotp: true,
        //         otp: otp
        //     }, 200, agent, function (verifyotpErr, verifyotpRes) {
        //         should.not.exist(verifyotpErr);
        //         verifyotpRes.body.status.should.equal(true);
        //         verifyotpRes.body.message.should.equal('User is verified :retailer@test.com');
        //         var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //         var segments = [{
        //             segment: verifyotpRes.body.segments[0]._id,
        //             categories: [{category: verifyotpRes.body.categories[0]._id}]
        //         }];
        //         commonUserUtil.createEachStepUser({
        //             username: 'retailer@test.com',
        //             password: 'password',
        //             ispassword: true,
        //             registrationCategory: registrationCategory,
        //             selectedSegments: segments,
        //             companyName: '1111111111'
        //         }, 200, agent, function (verifiedErr, verifiedRes) {
        //             should.not.exist(verifiedErr);
        //             verifiedRes.body.status.should.equal(true);
        //             verifiedRes.body.message.should.equal('User is successfully registered');
        //             var user=verifiedRes.body.user;

        //             //**
        //             commonUserUtil.createEachStepUser({username:'1111111111',password:'password',issendotp:true},200,agent,function (presendotpErr,presendotpRes) {
        //                 should.not.exist(presendotpErr);
        //                 presendotpRes.body.status.should.equal(true);
        //                 var otp = presendotpRes.body.otp;
        //                 presendotpRes.body.message.should.equal('An OTP has been sent to Phone :1111111111. ' + otp + ' is your One Time Password (OTP)');
        //                 commonUserUtil.createEachStepUser({
        //                     username: '1111111111',
        //                     password: 'password',
        //                     isverifyotp: true,
        //                     otp: otp
        //                 }, 200, agent, function (verifyotpErr, verifyotpRes) {
        //                     should.not.exist(verifyotpErr);
        //                     verifyotpRes.body.status.should.equal(true);
        //                     verifyotpRes.body.message.should.equal('User is verified :1111111111');
        //                     var registrationCategory = verifyotpRes.body.registrationCategories[0]._id;
        //                     var segments = [{
        //                         segment: verifyotpRes.body.segments[0]._id,
        //                         categories: [{category: verifyotpRes.body.categories[0]._id}]
        //                     }];
        //                     commonUserUtil.createEachStepUser({
        //                         username: '1111111111',
        //                         password: 'password',
        //                         ispassword: true,
        //                         registrationCategory: registrationCategory,
        //                         selectedSegments: segments
        //                     }, 400, agent, function (verifiedErr, verifiedRes) {
        //                         should.not.exist(verifiedErr);
        //                         verifiedRes.body.status.should.equal(false);
        //                         verifiedRes.body.message.should.equal('Someone has already registered with the company name - 1111111111. Please contact info@invipani.com');
        //                         var user = verifiedRes.body.user;
        //                         done();
        //                     });
        //                 });
        //             });
        //         });
        //     });
        // });
  //  });
    after(function(done) {
        User.remove().exec();
        // Company.remove().exec();
        // Contact.remove().exec();
        done();
    });
});


