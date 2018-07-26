var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    crypto = require('crypto');


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
var NewUserSchema = new Schema({

    mobile: {
        type: String,
        validate: [validePhoneNumbear, 'Mobile Number length should be 10 to 11 digits.'],
        trim: true,
        required:true
    },
 
    email: {
        type: String,
        trim: true,
        required:true
        //validate: [validateLocalStrategyProperty, 'Please fill in your email'],
        //match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },

    username: {
        type: String,
        validate:[valideUsernamelength,'Username should not be greater thea 10 chars'],
        unique: 'User name should be unique',
        trim: true,
        required:true
    },
    password: {
        type: String,
        required:true
        // validate: [validateLocalStrategyPassword, 'Password should be Minimum 6 characters at least 1 Capital, 1 Number and 1 Special Character (@#$%)']
    },
    salt: {
        type: String,
        default:''
    },
    status: {
        type: String,
        default:'Registered'
    },
})


NewUserSchema.pre('save', function (next) {
    var doc = this;
   // globalUtil.populateDisplayName(doc, function (displayname) {
       // doc.displayName = displayname;
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
        }
        next();
   // });
});

NewUserSchema.methods.hashPassword = function (password) {
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