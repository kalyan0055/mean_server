
var _ = require('lodash'),
    mongoose = require('mongoose'),
    errorHandler = require('../controllers/errors.server.controller'),
    usersJWTUtil = require('../controllers/utils/users.jwtutil'),
    logger = require('../../lib/log').getLogger('ACTIVITIES', 'DEBUG'),
    config = require('../../config/config'),
    UserActivity = mongoose.model('UserActivity'),
    User = mongoose.model('InternalUser');
var diff = require('deep-diff').diff;
var emptyModel = null;
var nonEmptymodel = null;
var totData = { lhs: null, rhs: null };

exports.saveActivity = function (req, res) {
    let originalData = req.body;
    if ('edit' == req.body['eventType'].toLowerCase()) {

        let lhs = req.body.effectedData.oldData;
        let rhs = req.body.effectedData.newData;
        var test = (_.pick(lhs, _.keys(rhs)))
        var differences = diff(test, rhs);
        let effectedData = [];
        for (let i = 0; i < differences.length; i++) {
            const element = differences[i].path.toString();
            effectedData.push({ column: element, oldData: differences[i].lhs, newData: differences[i].rhs })
        }
        var data = new UserActivity(req.body)
        data.effectedData = effectedData;

    }
    // else if ('add' == req.body['eventType'].toLowerCase()) {
    //     let emptyData = getEmptyModel(req.body['eventTargetType'], originalData)
    //     let lhs = emptyData.lhs;
    //     let rhs = emptyData.rhs;
    //     var test = (_.pick(lhs, _.keys(rhs)))
    //     // console.log(test, 'testing');

    //     var differences = diff(test, rhs);
    //     let effectedData = [];
    //     console.log(differences, 'deep diff example');
    //     for (let i = 0; i < differences.length; i++) {
    //         const element = differences[i].path.toString();
    //         effectedData.push({ column: element, oldData: differences[i].lhs, newData: differences[i].rhs })
    //     }
    //     console.log(effectedData);
    //     var data = new UserActivity(req.body)
    //     data.effectedData = effectedData;

    // }
    else {
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

},
// exports.getUserActivities = function (req, res) {
//     console.log('user activities',req.body.columns.length);
    
//     var fields = req.body.columns[req.body.order[0].column].name;
//     var sortBy = (req.body.order[0].dir == 'asc') ? 1 : -1;
//     let obj = {};
//     obj[`${fields}`] = sortBy
 
//     UserActivity.find({}).skip(req.body.start).limit(req.body.length).sort(obj).populate('user','-_id userType username').exec(async function (err, activities) {
//         if (err) {
//             return res.status(400).send({
//                 status: false,
//                 data: null,
//                 message: errorHandler.getErrorMessage(err)
//             })
//         } else {
//             var searchitem = null;
//             var serchdata = [];
//              if(req.body.columns.length > 0){
//                 console.log('helloc');
                 
//                 console.log( req.body.columns);
//                 let arr =  req.body.columns;
              
//                await arr.forEach(element => {
//                    console.log('Coming to foreah    ',element.search);
//                     if(element.search['value']){
//                         console.log('coming to foreach');          
//                         searchitem = element.search['value'].toLowerCase();     
//                         serchdata = activities.filter(function (item) {
//                           return     JSON.stringify(item).toLowerCase().includes(searchitem);
//                         });
//                     }
//                 });
//             }
//             else{
//                 if (req.body.search.value != '' || req.body.search.value != null) {
//                     searchitem = req.body.search.value.toLowerCase();               
//                     serchdata = activities.filter(function (item) {
//                       return JSON.stringify(item).toLowerCase().includes(searchitem);
//                     });
//                 } 
                 
//             }

//             const tot_count = await UserActivity.countDocuments();
//             return res.status(200).json({
//                 status: true,
//                 data: (!searchitem) ? activities : serchdata,
//                 tot_count: tot_count,
//             })
//         }

//     });

// },

exports.getUserActivities = async function  (req, res) {
  
    var fields = req.body.columns[req.body.order[0].column].name;
    var sortBy = (req.body.order[0].dir == 'desc') ? -1 :(req.body.order[0].dir == 'asc')?1:-1;
    let obj = {};
    obj[`${fields}`] = sortBy
    await UserActivity.find({}).skip(req.body.start).limit(req.body.length).sort(obj).populate('user','-_id userType username').exec(async function (err, activities) {
        if (err) {
            return res.status(400).send({
                status: false,
                data: null,
                message: errorHandler.getErrorMessage(err)
            })
        } else {
            
      await UserActivity.find({}).populate('user', '-_id userType username').exec(async function (err, Allactivities) {
                if (err) {
                    return res.status(400).send({
                        status: false,
                        data: null,
                        message: errorHandler.getErrorMessage(err)
                    })
                } else {
            // console.log('is it coming to else');
            var searchitem = null;
            var serchdata = [];

            if (req.body.search.value != '' && req.body.search.value != null) {
                // console.log('is it coming to if condition');
                searchitem = req.body.search.value.toLowerCase();
                serchdata = Allactivities.filter(function (item) {
                    return JSON.stringify(item).toLowerCase().includes(searchitem);
                });
            }
            else if (req.body.columns.length > 0) {
                // console.log('is it coming else if condition');
                let arr = req.body.columns;
                await arr.forEach(element => {
                    // console.log('Coming to foreah    ', element.search);
                    if (element.search['value']) {
                        // console.log('coming to foreach');
                        searchitem = element.search['value'].toLowerCase();
                        serchdata = Allactivities.filter(function (item) {
                            console.log( item,'ttttttttttttttttttt');
                        
                            return JSON.stringify(Object.values(item)).toLowerCase().includes(searchitem);
                        });
                    }
                });
            }
            else {  
            }

            const tot_count = await UserActivity.countDocuments();
            return res.status(200).json({
                status: true,
                data: (!searchitem) ? activities : serchdata,
                tot_count: tot_count,
                totData:Allactivities
            })
        }
   
        });
    }
});
},



exports.getActivitiesByType = function (req, res) {

    var types = req.body;
    console.log(types,'typesssssss');
    console.log(Object.keys(types),'These are keys');
    console.log(Object.values(types),'These are values');
    let key = Object.keys(types).toString();
    let values = _.flatten(Object.values(types));
    let obj = {}
    obj[`${key}`] = {$in:values}
    
        UserActivity.find(obj, function (err, eventTypes) {
            if (err) {
                logger.error('Eroor occured ', JSON.stringify(err));
                res.status(400).send({
                    status: true,
                    message: 'error occured while saving data'
                })
            } else {
                res.status(200).send({
                    status: true,
                    message: 'Activity Saved Succesfully',
                    data: eventTypes
                })
            }
        })

},


exports.getUniqColVal = function (req, res) {
    
    var types = req.body.type;
 
 
    UserActivity.find().distinct(types, function (err, eventTypes) {
       if(types === 'user'){
        User.find({'_id':{$in : eventTypes}},'username',function(err,result) {
            if (err) {
                logger.error('Eroor occured ', JSON.stringify(err));
                res.status(400).send({
                    status: true,
                    message: 'error occured while saving data'
                })
            } else {
                res.status(200).send({
                    status: true,
                    message: 'Activity Saved Succesfully',
                    data: result
                })
            }
          }); 
       }else{
        if (err) {
            logger.error('Eroor occured ', JSON.stringify(err));
            res.status(400).send({
                status: true,
                message: 'error occured while saving data'
            })
        } else {
            res.status(200).send({
                status: true,
                message: 'Activity Saved Succesfully',
                data: (types === 'user')?result:eventTypes
            })
        }
       }
       
    })

},

    function getEmptyModel(model, orgData) {

        switch (model) {
            case 'User': emptyModel = new User(); totData.lhs = emptyModel;
                nonEmptymodel = new User(orgData); totData.rhs = nonEmptymodel;
                break;

            default: totData = null;
                break;
        }
        console.log(totData);

        return totData;
    }
