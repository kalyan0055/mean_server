
var _ = require('lodash'),
mongoose = require('mongoose'),
errorHandler = require('../controllers/errors.server.controller'),
usersJWTUtil = require('../controllers/utils/users.jwtutil'),
logger = require('../../lib/log').getLogger('ACTIVITIES', 'DEBUG'),
config = require('../../config/config'),
UserActivity = mongoose.model('UserActivity');
var diff = require('deep-diff').diff;

exports.saveActivity = function(req,res){
    console.log(req.body);
    let data = new UserActivity(req.body)
    if('edit' == data['eventType'].toLowerCase() ){
    let data = new UserActivity()
        let lhs = data;
        let rhs = req.body.effectedData;
        console.log(lhs,rhs);
        
        var differences = diff(lhs, rhs);
        console.log(differences,'deep diff example');
    }
   
    
    data.save(function(err,activity){
        if(err){
            logger.error('Eroor occured ',JSON.stringify(err));
            logger.debug(err)
            res.status(400).send({
                status:true,
                message:'error occured while saving data'
            })
        }else{
            res.status(200).send({
                status:true,
                message:'Activity Saved Succesfully'
            })
        }
    })
    
}