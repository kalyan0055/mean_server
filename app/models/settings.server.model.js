'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

    var Settings = new Schema({
        ui_table:{
        type:String,
        require:true,
        },
        records_per_page :[{
            type:String,
             
        }],
        deleted :{
            type:Boolean,
            default:false           
        }
    })
mongoose.model('Settings',Settings)