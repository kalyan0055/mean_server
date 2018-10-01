'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TaxGroupSchema = new Schema({
    name: {
        type: String,
        default: '',
        required: 'Please fill Tax Group Name',
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    CGST: {
        type: Number,
        default: 0
    },
    SGST: {
        type: Number,
        default: 0
    },
    IGST: {
        type: Number,
        default: 0
    },
    cess: {
        type: Number,
        default: 0
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
    created: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});
TaxGroupSchema.set('versionKey', 'taxGroupVersionKey');
mongoose.model('TaxGroup', TaxGroupSchema);
