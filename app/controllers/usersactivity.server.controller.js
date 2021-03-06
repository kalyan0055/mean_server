
var _ = require('lodash'),
    mongoose = require('mongoose'),
    errorHandler = require('../controllers/errors.server.controller'),
    usersJWTUtil = require('../controllers/utils/users.jwtutil'),
    logger = require('../../lib/log').getLogger('ACTIVITIES', 'DEBUG'),
    config = require('../../config/config'),
    UserActivity = mongoose.model('UserActivity'),
    User = mongoose.model('InternalUser');
var diff = require('deep-diff').diff;

exports.saveActivity = function (req, res) {
   
    if ('edit' == req.body['eventType'].toLowerCase()) {  
               
                let lhs = req.body.effectedData.oldData;
                let rhs = req.body.effectedData.newData;
                 var test = (_.pick(lhs, _.keys(rhs)))
                console.log(test, 'testing');
                console.log(rhs, 'testing');

                var differences = diff(test, rhs);
                let effectedData =[];
                console.log(differences, 'deep diff example');
                 for (let i = 0; i < differences.length; i++) {
                     const element = differences[i].path.toString();
                     effectedData.push({column:element,oldData:differences[i].lhs,newData:differences[i].rhs})
                 }
                 console.log(effectedData);
                 var data = new UserActivity(req.body)
                  data.effectedData = effectedData; 
      
    }
    else{
        var data = new UserActivity(req.body)
    }


    data.save(function (err, activity) {
        if (err) {
            logger.error('Eroor occured ', JSON.stringify(err));
            res.status(400).send({
                status: true,
                message: 'error occured while saving data'
            })
        } else {
            res.status(200).send({
                status: true,
                message: 'Activity Saved Succesfully'
            })
        }
    })

}
 
 

function getDataById(targetTable, id, done) {
    
      usersJWTUtil.findUserByIdOnly(id, function (err, user) {
        if (err || !user) {
            done(new Error('User is not authorized'), false, false);
        } else {
             done(null,user)    
        }
    });

   

}
