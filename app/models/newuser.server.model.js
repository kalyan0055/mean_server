var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto')
    globalUtil = require('../controllers/utils/common.global.util');
  

var validePhoneNumbear = function (property) {
    if (property) {
        return (property.length <= 11 && property.length >= 10);
    }
    return true;
}

var valideUsernamelength = function (property) {
    if (property) {
        return (property.length  >= 10);
    }
    return true;
}
var validatePhoneNumberLength = function(property) {
    if(property) {
        return (property.length <= 11 && property.length >=10);
    }
    return true;
};
var validateLength256 = function(property) {
    if(property) {
        return (property.length <= 256);
    }
    return true;
};

var NewUserSchema = new Schema({

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
 
    profileImageURL: {
        type: String,
        default: 'modules/users/img/profile/default.png'
    },
    croppedProfileImageURL: {
        type: String,
        default: 'modules/users/img/profile/default-resize-240-240.png'
    },
  
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
 
    updated: {
        type: Date
    },
    created: {
        type: Date,
        default: Date.now
    },
 
    otp: {
        type: String
    },
    emailOtp:{
        type: String
    },
 
    userType: {
        type: String,
        enum: ['User', 'Employee', 'Other','Adminuser'],
        default: 'User'
    },
 
    emailVerified: {
        type: Boolean,
        default: false
    },
    mobileVerified: {
        type: Boolean,
        default: false
    },
 
    status: {
        type: String,
        enum: ['Register Request', 'Verified','Registered','User Rejected','Blocked','Segments'],
        default: ['Register Request']
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
    },
    reset_password: {
        type: Boolean,
        required: 'Please set deleted flag',
        default: false
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },// 1 hour
})


// NewUserSchema.pre('save', function (next) {
//     var doc = this;
//    // globalUtil.populateDisplayName(doc, function (displayname) {
//        // doc.displayName = displayname;
//         if (doc.password && doc.password.length > 6) {
//             doc.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
//             doc.password = doc.hashPassword(doc.password);
//             if (doc.profileImageURL) {
//                 var fileName = doc.profileImageURL.substring(0, doc.profileImageURL.lastIndexOf('.'));
//                 var croppedProfileImageURL = fileName + '-resize-240-240.png';
//                 if (doc.croppedProfileImageURL !== croppedProfileImageURL) {
//                     doc.croppedProfileImageURL = croppedProfileImageURL;
//                 }
//             }
//         }
//         next();
//    // });
// });

NewUserSchema.methods.hashPassword = function (password) {
    console.log('is it coming',this.salt);
    if (this.salt && password) {
        return crypto.pbkdf2Sync(password, this.salt, 10000, 64, 'sha1').toString('base64');
     } else {
        return password;
    }
};

/**
 * Create instance method for authenticating user
 */
NewUserSchema.methods.authenticate = function (password) {
    return this.password === this.hashPassword(password);
};
/**
 * Find possible not used username
 */
// NewUserSchema.statics.findUniqueUsername = function (username, suffix, callback) {
//     var _this = this;
//     var possibleUsername = username + (suffix || '');

//     _this.findOne({
//         username: possibleUsername
//     }, function (err, user) {
//         if (!err) {
//             if (!user) {
//                 callback(possibleUsername);
//             } else {
//                 return _this.findUniqueUsername(username, (suffix || 0) + 1, callback);
//             }
//         } else {
//             callback(null);
//         }
//     });
// };
// NewUserSchema.set('versionKey', 'userVersionKey');
mongoose.model('Newuser', NewUserSchema);