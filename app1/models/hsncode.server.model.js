'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var HsncodesSchema = new Schema({
    name: {
        type: String,
        default: '',
        trim: true
    },
    chapterCode: {
        type: String,
        default: '',
        required: 'Please fill chapter code',
        trim: true
    },
    chapterDescription: {
        type: String,
        default: '',
        trim: true
    },
    headingCode: {
        type: String,
        default: '',
        required: 'Please fill heading code',
        trim: true
    },
    headingDescription: {
        type: String,
        default: '',
        trim: true
    },
    hsncode:{
        type: String,
        default: '',
        required: 'Please fill hsn code',
        trim: true
    },
    description: {
        type: String,
        default: '',
        trim: true
    },
    unitOfMeasure: {
        type: Schema.ObjectId,
        ref: 'UnitOfMeasure'
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

mongoose.model('Hsncodes', HsncodesSchema);
