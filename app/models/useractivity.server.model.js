'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * UserActivity Schema
 */
var UserActivitySchema = new Schema({
    name: {
        type: String,
        default: '',
        required: 'Please fill activity name',
        trim: true
    },
    target: {
        message: {
            type: Schema.ObjectId,
            ref: 'Message'
        },
        order: {
            type: Schema.ObjectId,
            ref: 'Order'
        },
        offer: {
            type: Schema.ObjectId,
            ref: 'Offer'
        },
        user: {
            type: Schema.ObjectId,
            ref: 'User'
        },
        contact: {
            type: Schema.ObjectId,
            ref: 'Contact'
        },
        group: {
            type: Schema.ObjectId,
            ref: 'Group'
        },
        itemMaster: {
            type: Schema.ObjectId,
            ref: 'ItemMaster'
        },
        importFile: {
            type: Schema.ObjectId,
            ref: 'ImportFile'
        },
        inventory: {
            type: Schema.ObjectId,
            ref: 'Inventory'
        },
        paymentTerm: {
            type: Schema.ObjectId,
            ref: 'PaymentTerm'
        },
        productBrand: {
            type: Schema.ObjectId,
            ref: 'ProductBrand'
        },
        category: {
            type: Schema.ObjectId,
            ref: 'Category'
        },
        report: {
            type: Schema.ObjectId,
            ref: 'Report'
        },
        stockMaster: {
            type: Schema.ObjectId,
            ref: 'StockMaster'
        },
        taxGroup: {
            type: Schema.ObjectId,
            ref: 'TaxGroup'
        },
        unitOfMeasure: {
            type: Schema.ObjectId,
            ref: 'UnitOfMeasure'
        },
        businessUnit: {
            type: Schema.ObjectId,
            ref: 'BusinessUnit'
        },
        notification: {
            type: Schema.ObjectId,
            ref: 'Notification'
        },
        todo: {
            type: Schema.ObjectId,
            ref: 'Todo'
        }
    },
    eventType: {
        type: String,
        enum: ['LogOut', 'Login', 'Add', 'Edit', 'Delete', 'Disable', 'View', 'List', 'Search'],
        default: 'Login'
    },

    eventTargetType: {
        type: String,
        enum: ['User', 'TaxGroup', 'UnitOfMeasure', 'Todo', 'Notification', 'Contact', 'Group', 'Offer', 'Order', 'ItemMaster', 'Inventory', 'ProductCategory', 'ProductBrand', 'Inventory', 'ImportFile', 'Category', 'Settings', 'BusinessUnit', 'Message', 'Profile', 'Report', 'StockMaster'],
        default: 'User'
    },

    effectedData:[
        {column:''},
        {oldata:''},
        {newdata:''}
    ],
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
    created: {
        type: Date,
        default: Date.now
    },
    // lastUpdated: {
    //     type: Date,
    //     default: Date.now
    // },
    // lastUpdatedUser: {
    //     type: Schema.ObjectId,
    //     ref: 'User'
    // },
  
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});


UserActivitySchema.set('versionKey', 'userActivityVersionKey');
mongoose.model('UserActivity', UserActivitySchema);
