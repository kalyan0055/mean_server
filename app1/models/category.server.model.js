'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Category Schema
 *
 *
 *
 * *********

 db.categories.insert({'name': 'Agriculture', 'type':'MainCategory');
db.categories.insert({'name': 'Agricultural Equipment', 'type':'SubCategory1'});
db.categories.insert({'name': 'Agricultural Waste', 'type':'SubCategory1'});
db.categories.insert({'name': 'Agriculture Machinery Parts', 'type':'SubCategory1'});
db.categories.insert({'name': 'Agrochemicals & Pesticides', 'type':'SubCategory1'});
db.categories.insert({'name': 'Animal Feed', 'type':'SubCategory1'});
db.categories.insert({'name': 'Animal Products', 'type':'SubCategory1'});
db.categories.insert({'name': 'Beans', 'type':'SubCategory1'});
db.categories.insert({'name': 'Cacao Beans', 'type':'SubCategory1'});
db.categories.insert({'name': 'Coffee Beans', 'type':'SubCategory1'});
db.categories.insert({'name': 'Fertilizer', 'type':'SubCategory1'});
db.categories.insert({'name': 'Forestry Machinery', 'type':'SubCategory1'});
db.categories.insert({'name': 'Fresh Fruit', 'type':'SubCategory1'});
db.categories.insert({'name': 'Fresh Vegetables', 'type':'SubCategory1'});
db.categories.insert({'name': 'Grain', 'type':'SubCategory1'});
db.categories.insert({'name': 'Herbal Cigars & Cigarettes', 'type':'SubCategory1'});
db.categories.insert({'name': 'Mushrooms & Truffles', 'type':'SubCategory1'});
db.categories.insert({'name': 'Nuts & Kernels', 'type':'SubCategory1'});
db.categories.insert({'name': 'Ornamental Plants', 'type':'SubCategory1'});
db.categories.insert({'name': 'Other Agriculture Products', 'type':'SubCategory1'});
db.categories.insert({'name': 'Plant & Animal Oil', 'type':'SubCategory1'});
db.categories.insert({'name': 'Plant Seeds & Bulbs', 'type':'SubCategory1'});
db.categories.insert({'name': 'Timber Raw Materials', 'type':'SubCategory1'});
db.categories.insert({'name': 'Vanilla Beans', 'type':'SubCategory1'});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Agricultural Equipment', 'type':'SubCategory1'})._id}});

db.categories.insert({'name': 'Agricultural Greenhouses', 'type':'SubCategory2'});
db.categories.insert({'name': 'Animal & Poultry Husbandry Equipment', 'type':'SubCategory2'});
db.categories.insert({'name': 'Aquaculture Equipment', 'type':'SubCategory2'});
db.categories.insert({'name': 'Irrigation & Hydroponics Eqiupment', 'type':'SubCategory2'});

db.categories.update({'name': 'Agricultural Equipment', 'type':'SubCategory1'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Agricultural Greenhouses', 'type':'SubCategory2'})._id}});
db.categories.update({'name': 'Agricultural Equipment', 'type':'SubCategory1'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Animal & Poultry Husbandry Equipment', 'type':'SubCategory2'})._id}});
db.categories.update({'name': 'Agricultural Equipment', 'type':'SubCategory1'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Aquaculture Equipment', 'type':'SubCategory2'})._id}});
db.categories.update({'name': 'Agricultural Equipment', 'type':'SubCategory1'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Irrigation & Hydroponics Eqiupment', 'type':'SubCategory2'})._id}});

db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Agricultural Waste', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Agriculture Machinery Parts', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Agrochemicals & Pesticides', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Animal Feed', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Animal Products', 'type':'SubCategory1'})._id}});

db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Beans', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Cacao Beans', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Coffee Beans', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Fertilizer', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Forestry Machinery', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Fresh Fruit', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Fresh Vegetables', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Grain', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Herbal Cigars & Cigarettes', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Mushrooms & Truffles', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Nuts & Kernels', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Ornamental Plants', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Other Agriculture Products', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Plant & Animal Oil', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Plant Seeds & Bulbs', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Timber Raw Materials', 'type':'SubCategory1'})._id}});
db.categories.update({'name': 'Agriculture', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Vanilla Beans', 'type':'SubCategory1'})._id}});

 db.categories.insert({'name': 'Food & Beverage', 'type':'MainCategory');
 db.categories.insert({'name': 'Apparel', 'type':'MainCategory');
 db.categories.insert({'name': 'Handicrafts & Gifts', 'type':'MainCategory');

 * *********
 db.categories.insert({'name': 'Other', 'type':'MainCategory'});
 db.categories.insert({'name': 'Other', 'type':'SubCategory1'});
 db.categories.insert({'name': 'Other', 'type':'SubCategory2'});
 db.categories.insert({'name': 'Other', 'type':'SubCategory3'});
 db.categories.insert({'name': 'Other', 'type':'SubCategory4'});
 db.categories.insert({'name': 'Farm Equipment', 'type':'SubCategory1'});
 db.categories.insert({'name': 'Farm Products', 'type':'SubCategory1'});
 db.categories.insert({'name': 'Agricultural', 'type':'MainCategory');
 db.categories.update({'name': 'Agricultural', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Farm Equipment', 'type':'SubCategory1'})._id}});
 db.categories.update({'name': 'Agricultural', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Farm Products', 'type':'SubCategory1'})._id}});
 db.categories.update({'name': 'Agricultural', 'type':'MainCategory'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Other', 'type':'SubCategory1'})._id}});
 db.categories.update({'name': 'Farm Equipment', 'type':'SubCategory1'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Other', 'type':'SubCategory2'})._id}});
 db.categories.update({'name': 'Farm Products', 'type':'SubCategory1'}, {$addToSet : {'children' :db.categories.findOne({'name': 'Other', 'type':'SubCategory2'})._id}});
 *
 */
var CategorySchema = new Schema({
    name: {
        type: String,
        default: '',
        required: 'Please fill Category name',
        trim: true
    },
    aliases: [{
        type: String,
        default: '',
        trim: true
    }],
    superClassification: [{
        type: String,
        default: '',
        trim: true
    }
    ],
    type: {
        type: String,
        enum: ['MainCategory', 'SubCategory1', 'SubCategory2', 'SubCategory3', 'SubCategory4'],
        default: 'MainCategory',
        trim: true
    },
    // Category code is three character unique code which is farmed from the name of the category. These category codes are used for generating the product unique id or sample number
    // for a product
    code: {
        type: String,
        default: '',
        /* required: 'Please fill Category Code',*/
        trim: true
    },
    productCategory:{
        type: Boolean,
        default: false
    },
    grandParent:{
        type: Schema.ObjectId,
        ref: 'Category'
    },
    parent: {
        type: Schema.ObjectId,
        ref: 'Category'
    },
    children: [{
        type: Schema.ObjectId,
        ref: 'Category'
    }
    ],
    categoryImageURL1: {
        type: String,
        default: 'modules/categories/img/profile/default.png'
    },
    croppedCategoryImageURL1: {
        type: String,
        default: 'modules/categories/img/profile/default.png'
    },
    taxGroups:[{
        type: Schema.ObjectId,
        ref: 'TaxGroup'
    }],
    productBrands: [{
        type: Schema.ObjectId,
        ref: 'ProductBrand'
    }],
    description:{
        type: String,
        default: '',
        trim: true
    },
    unitOfMeasures: [{
        type: Schema.ObjectId,
        ref: 'UnitOfMeasure'
    }],
    hsnCodes: [{
        type: Schema.ObjectId,
        ref: 'Hsncodes'
    }],
    productAttributes: {
        brand: {
            type: Boolean,
            default: false
        },
        keywords: [{
            type: String,
            default: '',
            trim: true
        }],
        grade: {
            enabled: {
                type: Boolean,
                default: false
            },
            // Size Vs 10m, 20m, 30m
            // Color Vs Blue, Black, White, Yellow
            // Fineness Vs Superior, Medium, Low
            definition: [{
                attributeKey: {
                    type: String,
                    default: '',
                    trim: true
                },
                attributeValue: [String]
            }]
        },
        quality: {
            enabled: {
                type: Boolean,
                default: false
            },
            // Size Vs 10m, 20m, 30m
            // Color Vs Blue, Black, White, Yellow
            // Fineness Vs Superior, Medium, Low
            definition: [{
                attributeKey: {
                    type: String,
                    default: '',
                    trim: true
                },
                attributeValue: [String]
            }]
        },
        sampleNumber: {
            type: Boolean,
            default: false
        },
        fssaiLicenceNumber: {
            type: Boolean,
            default: false
        },
        testCertifcate: {
            type: Boolean,
            default: false
        }
    },
    inventoryAttributes: {
        barcode: {
            type: Boolean,
            default: false
        },
        batchNumber: {
            type: Boolean,
            default: false
        },
        manufactureDate: {
            type: Boolean,
            default: false
        },
        packagingDate: {
            type: Boolean,
            default: false
        },
        expiryDate: {
            type: Boolean,
            default: false
        },
        bestBefore: {
            type: Boolean,
            default: false
        }
    },

    searchFilters: {
        brand: {
            type: Boolean,
            default: false
        },
        grade: {
            type: Boolean,
            default: false
        },
        quality: {
            type: Boolean,
            default: false
        },
        price: {
            type: Boolean,
            default: false
        },
        moq: {
            type: Boolean,
            default: false
        },
        quantity: {
            type: Boolean,
            default: false
        }
    },
    sortCriteria: {
        brand: {
            type: Boolean,
            default: false
        },
        grade: {
            type: Boolean,
            default: false
        },
        quality: {
            type: Boolean,
            default: false
        },
        price: {
            type: Boolean,
            default: false
        },
        moq: {
            type: Boolean,
            default: false
        },
        quantity: {
            type: Boolean,
            default: false
        }
    },
    created: {
        type: Date,
        default: Date.now
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    lastUpdatedUser: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    reviewed: {
        type: Number,
        enum: [0, 1],
        default: 1,
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
    }
});

mongoose.model('Category', CategorySchema);
