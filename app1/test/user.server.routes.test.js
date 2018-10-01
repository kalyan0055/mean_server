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
            username:'somevalue@nvipani.com',
            issendotp:true,
            issendemail:true,
            otp:'087303',
            token:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0wOS0yMVQwOTozNDowNi4wNzJaIn0.THc5_hPDe6fosNydn60bnw_LHKP3RZSEgfSzQxK58MM'
         } // }           eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0wOS0wN1QxMjo1OTozOS4yMjVaIn0.KYNyfY_J7BgBTf9ZtkJ0MhsOherAZZ02bYUDeOsBTPM
        ,{
            username:'somevalue@nvipani.com',
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
                                       done();
                    });
                });

            });
        });
   });

   it('should be delete by id only',function(done){
       commonUserUtil.findId("3232130slfkaslfks",400,agent,function(err,result){
        //    console.log(err,'delete error');
           
        should.not.exist(err);
           done();
       })
   });

   it('should be able to send email by taking valid data for reset password request',function(done){
    commonUserUtil.resetPassword({token:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOnsidXNlcm5hbWUiOiJpbmZvQG52aXBhbmkuY29tIiwiaWQiOiI1YjdkMWU5ZjE1ODM0NzFmMDQyMTc1OTUifSwiZXhwIjoiMjAxOC0wOS0xNFQwNjoxNjoyMy45OTRaIn0.DTwvg1okcbm6PqqwUFeSSqkEvos1jBQMFuBz0LwybdE',id:'',reset_password:false,username:'emandi1@nvipani.com'},401,agent,function(err,result){
        should.not.exist(err);
        // console.log(result,'reset password error');
       result.body.status.should.equal(false);
        done();        
    })
   });

  
    after(function(done) {
        User.remove().exec();
        // Company.remove().exec();
        // Contact.remove().exec();
        done();
    });
});


