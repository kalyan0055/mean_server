'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    globalUtil = require('../controllers/utils/common.global.util'),
    Schema = mongoose.Schema,
    crypto = require('crypto');

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function(property) {
    return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function(password) {
    return (this.provider !== 'local' || (password && password.length > 6));
};

var validateLength128 = function(property) {
    if(property) {
        return (property.length <= 128);
    }
    return true;

};

/**
 * A Validation function for checking the length
 */
var validatePhoneNumberLength = function(property) {
    if(property) {
        return (property.length <= 11 && property.length >=10);
    }
    return true;
};

/**
 * A Validation function for checking the length
 */
var validatePincodeLength = function(property) {
    if(property) {
        return (property.length === 6);
    }
    return true;
};
/**
 * A Validation function for checking the length
 */
var validateLength1024 = function(property) {
    if(property) {
        return (property.length <= 1024);
    }
    return true;
};

/**
 * A Validation function for checking the length
 */
var validateLength256 = function(property) {
    if(property) {
        return (property.length <= 256);
    }
    return true;
};
/**
 * User Schema
 */
var UserSchema = new Schema({
    firstName: {
        type: String,
        trim: true,
        default: '',
        validate: [validateLength256, 'Please fill in your first name'],
        required:true
    },
    middleName: {
        type: String,
        trim: true,
        default: ''
        /*validate: [validateLocalStrategyProperty, 'Please fill in your last name']*/
    },
    lastName: {
        type: String,
        trim: true,
        default: '',
        validate: [validateLength256, 'Please fill in your last name']
    },
    displayName: {
        type: String,
        trim: true
    },
    allowRegistration: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        trim: true,
        default: ''
        //validate: [validateLocalStrategyProperty, 'Please fill in your email'],
        //match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },

    username: {
        type: String,
        unique: 'User name should be unique',
        trim: true
    },
    password: {
        type: String,
        default: '',
        // validate: [validateLocalStrategyPassword, 'Password should be Minimum 6 characters at least 1 Capital, 1 Number and 1 Special Character (@#$%)']
    },
    salt: {
        type: String
    },
    provider: {
        type: String
    },
    serverUrl: {
        type: String
    },
    profileImageURL: {
        type: String,
        default: 'modules/users/img/profile/default.png'
    },
    croppedProfileImageURL: {
        type: String,
        default: 'modules/users/img/profile/default-resize-240-240.png'
    },
    providerData: {},
    additionalProvidersData: {},
    roles: {
        type: [{
            type: String,
            enum: ['user', 'admin']
        }],
        default: ['user']
    },
    mobile: {
        type: String,
        default: '',
        validate: [validatePhoneNumberLength, 'Mobile Number length should be 10 to 11 digits.'],
        trim: true
    },
    devices: [{
        deviceid: {
            type: String
        },
        name: {
            type: String
        },
        description: {
            type: String
        },
        token: {
            type: String
        },
        appversion: {
            type:String
        },
        active: {
            type: Boolean,
            default: true
        }
    }],
    accountActivity: [{
        deviceid: {
            type: String
        },
        accessType: { // Browser, Mobile etc
            type: String
        },
        location: {
            type: String
        },
        ipAddress: {
            type: String
        },
        sessionId: {
            type: String
        },
        loginTime: {
            type: Date
        },
        logoutTime: {
            type: Date
        },
        appversion: {
            type:String
        },
        active:{
            type: Boolean,
            default: true
        }
    }],
    updated: {
        type: Date
    },
    created: {
        type: Date,
        default: Date.now
    },
    /* For reset password */
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    statusToken:{
        type: String
    },
    otp: {
        type: String
    },
    emailOtp:{
        type: String
    },
    forgotPasswordOtp: {
        type: String
    },
    company: {
        type: Schema.ObjectId,
        ref: 'Company'
    },

    companies: [{
        company: {
            type: Schema.ObjectId,
            ref: 'Company'
        },
        userGroup: {
            type: Schema.ObjectId,
            ref: 'UserGroup'
        }
    }
    ],
    userType: {
        type: String,
        enum: ['User', 'Employee', 'Other'],
        default: 'User'
    },
    registerOption:{
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    mobileVerified: {
        type: Boolean,
        default: false
    },
    acceptTerms: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Register Request', 'Verified','Registered','User Rejected','Blocked','Segments'],
        default: ['Register Request']
    },
    digitalSignature: {
        type: String,
        default: '',
        trim: true
    },
    disabled: {
        type: Boolean,
        required: 'Please set disabled flag',
        default: false
    },
    deleted: {
        type: Boolean,
        required: 'Please set deleted flag',
        default: false
    }
   
});

/**
 * A Validation function for checking the length
 */


/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre('save', function(next) {
    var doc=this;
    globalUtil.populateDisplayName(doc,function(displayname) {
        doc.displayName = displayname;
        if (doc.password && doc.password.length > 6) {
            doc.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
            doc.password = doc.hashPassword(doc.password);


            if (doc.profileImageURL) {

                var fileName = doc.profileImageURL.substring(0, doc.profileImageURL.lastIndexOf('.'));

                var croppedProfileImageURL = fileName + '-resize-240-240.png';

                if (doc.croppedProfileImageURL !== croppedProfileImageURL) {
                    doc.croppedProfileImageURL = croppedProfileImageURL;
                }
            }


            //this.userCategory.enumValues=this.fieldProperties('userCategory','enum');
        }
        next();
    });





});

/*

UserSchema.methods.fieldProperties=function (fieldName, propertyName) {
			var fieldRef = UserSchema.path(fieldName);
			if (fieldRef.options[propertyName]) {
				return fieldRef.options[propertyName];
			}

			return;

};*/
/**
 * Create instance method for hashing a password
 */
UserSchema.methods.hashPassword = function(password) {
      
    if (this.salt && password) {
        console.log('if part hashpass funt',this.salt);
        console.log( crypto.pbkdf2Sync(password, this.salt, 10000, 64,'sha1').toString('base64'));
        
        return crypto.pbkdf2Sync(password, this.salt, 10000, 64,'sha1').toString('base64');
    } else {
        return password;
    }
};

/**
 * Create instance method for authenticating user
 */
UserSchema.methods.authenticate = function(password) {
    console.log(password,'coming from passport js');
    
      return this.password === this.hashPassword(password);;
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = function(username, suffix, callback) {
    var _this = this;
    var possibleUsername = username + (suffix || '');

    _this.findOne({
        username: possibleUsername
    }, function(err, user) {
        if (!err) {
            if (!user) {
                callback(possibleUsername);
            } else {
                return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
            }
        } else {
            callback(null);
        }
    });
};
UserSchema.set('versionKey', 'userVersionKey');
mongoose.model('User', UserSchema);
