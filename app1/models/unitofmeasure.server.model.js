'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var UnitOfMeasureSchema = new Schema({
    // The name For Compound UnitOfMeasure the name ex: Bag of 10 Packs
    // The name for simple UnitOfMeasure is given by user
    name: {
        type: String,
        default: '',
        required: 'Please fill Unit Of Measure Name',
        trim: true
    },
    //enum: ['Kg', 'gram', 'litre', 'ml', 'count', 'tonne', 'Bag', 'Box', 'Carton', 'Bale', 'Candy', 'Bundle', 'Case', 'metre', 'dozen', 'inch', 'foot', 'Pack', 'Tray', 'Other'],
    symbol: {
        type: String,
        default: '',
        required: 'Please fill Unit Of Measure Symbol',
        trim: true
    },
    // Unique Quantity Code (UQC) - BAG, KGS, KLR etc
    // For compound type, the uqc code will not present
    uqcCode: {
        type: String,
        default: '',
        trim: true
    },
    // Quantity Type - Measure, Length, Volume, Weight
    quantityType: {
        type: String,
        default: '',
        required: 'Please fill Unit Quantity Type',
        trim: true
    },
    // Unique Quantity Description - CUBIC METER, BOTTLES and BILLIONS OF UNITS etc
    description: {
        type: String,
        default: '',
        trim: true
    },
    numberOfDecimalPlaces: {
        type: Number,
        default: 0
    },
    conversion: {
        type: Number,
        default: 0
    },
    firstUnitOfMeasure: {
        type: Schema.ObjectId,
        ref: 'UnitOfMeasure'
    },
    secondUnitOfMeasure: {
        type: Schema.ObjectId,
        ref: 'UnitOfMeasure'
    },
    type: {
        type: String,
        enum: ['Simple', 'Compound'],
        default: 'Simple',
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
    },
    lastUpdatedUser: {
        type: Schema.ObjectId,
        ref: 'User'
    }
});
/**
 * Hook a pre save method
 */
/*UnitOfMeasureSchema.pre('save', function (next) {
    if (this.type && this.type === 'Compound') {
        this.name = this.firstUnitOfMeasure.symbol + ' Of ' + this.conversion + this.secondUnitOfMeasure.symbol;
        this.description = this.firstUnitOfMeasure.symbol + ' Of ' + this.conversion + this.secondUnitOfMeasure.symbol;
        this.symbol = this.firstUnitOfMeasure.symbol + ' (' + this.conversion + this.secondUnitOfMeasure.symbol + ')';
        this.quantityType = this.secondUnitOfMeasure.quantityType;
    }
    next();
});*/
UnitOfMeasureSchema.set('versionKey', 'unitOfMeasureVersionKey');
mongoose.model('UnitOfMeasure', UnitOfMeasureSchema);
