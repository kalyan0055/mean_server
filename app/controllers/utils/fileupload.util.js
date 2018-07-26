'use strict';
var fs = require('fs'),
    zipExtractor = require('extract-zip'),
    usersJWTUtil = require('./users.jwtutil'),
    util = require('./common.util'),
    config = require('../../../config/config'),
    async = require('async'),
    mime = require('mime-types'),
    rePath = require('path'),
    gm = require('gm').subClass({imageMagick: true}),
    errorHandler = require('../errors.server.controller'),
    logger = require('../../../lib/log').getLogger('FILEUPLOAD', 'DEBUG');


var resizedFilePath = function (filePath) {

    var fileName = filePath.lastIndexOf('.')>0 ? filePath.substring(0, filePath.lastIndexOf('.')):filePath;

    return fileName + '-resize-240-240.png';
};
/*var contactHeader={firstName:'First Name',lastName:'Last Name'};*/
/*var inventoryHeader={name:'First Name',lastName:'Last Name'};*/

function getSingleFileObject(files,done) {
    if(files instanceof  Array && files.length>0){
        done(files[0]);
    }else {
        done(null);
    }
}
exports.fileUploadPath = function (req,res) {
    var imageImportPath= {
        users: './public/modules/users/img/profile/uploads/',
        businessprofile: './public/modules/companies/img/profile/uploads/',
        product: './public/modules/products/img/profile/uploads/',
        inventory: './public/modules/inventories/img/profile/uploads/',
        contact:'./public/modules/contacts/img/profile/uploads/',
        group:'./public/modules/groups/img/profile/uploads/'
    };
    var imagePath= {
        users: 'modules/users/img/profile/uploads/',
        businessprofile: 'modules/companies/img/profile/uploads/',
        product: 'modules/products/img/profile/uploads/',
        inventory: 'modules/inventories/img/profile/uploads/',
        contact:'modules/contacts/img/profile/uploads/',
        group:'modules/groups/img/profile/uploads/'
    };
    getSingleFileObject(req.files,function (file) {
        if(file) {
            logger.debug('Profile Picture [name:' + file.name + ', fieldname:' +file.fieldname + ', originalname:' + file.originalname + ']');
            var token = req.body.token || req.headers.token;
            if (token) {
                logger.debug('Company Profile Picture [name:' + file.name + ', fieldname:' + file.fieldname + ', originalname:' + file.originalname + ']');
                usersJWTUtil.findUserByToken(token, function (err, user) {
                    if (user) {
                        var path = imageImportPath[req.headers.uploadpath] + file.filename;
                        logger.debug('path:' + imagePath[req.headers.uploadpath] + file.filename);

                        fs.rename(file.path,path, function (uploadError) {
                            if (uploadError || !file.mimetype) {
                                return res.status(400).send({
                                    message: 'Error occurred while uploading file at ' + req.headers.uploadpath
                                });
                            } else {
                                // some files would not be resized appropriately
                                // http://stackoverflow.com/questions/5870466/imagemagick-incorrect-dimensions
                                // you have two options:
                                // use the '!' flag to ignore aspect ratio
                                //var fileNameAndExt = path.split('.');

                                var fileName = rePath.basename(path);
                                //if it is a zip file of images, then extract and upload to appropriate location
                                if (file.mimetype.indexOf('zip') >= 1) {
                                    var targetFolder = rePath.resolve(imageImportPath.inventory + 'extracted/' + user._id);
                                    zipExtractor(path, {dir: targetFolder}, function (err) {
                                        if (err) {
                                            // extraction is complete. make sure to handle the err
                                            logger.error(err);
                                            res.status(400).send({message: err.message});
                                        }
                                        else {
                                            if (util.isDirectoryAccessible(targetFolder + '/' + fileName)) {
                                                targetFolder = targetFolder + '/' + fileName;
                                            }
                                            logger.info('Target dir:' + targetFolder);
                                            res.status(200).send({targetDir: targetFolder, status: true});
                                        }

                                    });
                                }
                                else {
                                    var resizePath = resizedFilePath(path);

                                    var uploadImagePath = imagePath[req.headers.uploadpath] + file.filename;
                                    var resizeUploadImagePath = resizedFilePath(uploadImagePath);
                                    if (file.mimetype && file.mimetype.toString().indexOf('image/') === 0)
                                        gm(path)
                                            .resize(240, 240, '!')
                                            .write(resizePath, function (err) {
                                                if (!err) {
                                                    //logger.debug(size.width > size.height ? 'wider - '+size : 'taller than you - '+size);
                                                    logger.debug('Resized Path - ' + resizePath);
                                                    logger.debug('Resized Upload Image Path - ' + resizeUploadImagePath);
                                                    return res.jsonp({
                                                        imageURI: imagePath[req.headers.uploadpath] + file.filename,
                                                        resizeImageURI: resizeUploadImagePath
                                                    });
                                                } else {
                                                    logger.debug('Resized Path - ' + resizePath);
                                                    logger.debug('Resized Upload Image Path - ' + resizeUploadImagePath);
                                                    logger.error('Error occurred while resizing the uploaded file at ' + req.headers.uploadpath, err);

                                                    return res.jsonp({
                                                        imageURI: imagePath[req.headers.uploadpath] + file.filename,
                                                        resizeImageURI: resizeUploadImagePath
                                                    });
                                                }
                                            });
                                    else {
                                        return res.jsonp({
                                            imageURI: uploadImagePath
                                        });
                                    }
                                }

                                /*                        gm(path)
                                 .size(function (err, size) {
                                 if (!err) {
                                 logger.debug(size.width > size.height ? 'wider - '+size : 'taller than you - '+size);
                                 logger.debug('Image Path-'+imagePath[req.headers.uploadpath]+ req.files.file.name);
                                 return res.jsonp({imageURI:imagePath[req.headers.uploadpath]+ req.files.file.name});
                                 } else {
                                 logger.error('Error occurred while checking the size of the uploaded file at '+req.headers.uploadpath, err);
                                 logger.debug('Image Path-'+imagePath[req.headers.uploadpath]+ req.files.file.name);
                                 return res.jsonp({imageURI:imagePath[req.headers.uploadpath]+ req.files.file.name});
                                 }

                                 });*/
                            }
                        });

                    } else {
                        res.status(400).send({
                            message: 'User is not signed in'
                        });
                    }
                });
            } else {
                res.status(400).send({
                    message: 'User is not signed in'
                });
            }
        }else{
            res.status(400).send({
                message: 'No Files'
            });
        }
    });

};

function updateUser (user,docs,done) {

        async.each(docs, function (doc, docCallBack) {
            doc.user = user._id;
            docCallBack();

        }, function (docErr) {
            if (!docErr) done(null,docs);
            else done(docErr);
        });

}
exports.fileImportPath = function (req,res) {
    var imagePath= {
        product: 'Product',
        inventory: 'Inventory',
        contact: 'Contact',
        hsncode:'Hsncodes'
    };
 var token = req.body.token || req.headers.token;
    var importType;
 if(req.body.type) {
     importType = req.body.type;
 }
    if (token) {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (user) {
                var mongoose = require('mongoose');

                if (mongoose.modelNames().filter(function (t) {
                        return t === imagePath[importType] || t === importType;
                    }).length > 0){
                    updateUser(user, req.body.doc, function (error, docs) {
                        mongoose.model(imagePath[importType] ? imagePath[importType] : importType).collection.insert(docs, function (err, listDocs) {
                            if (err) {
                                // TODO: handle error
                                console.info('%d ' + importType + ' are failed to store');
                                res.status(400).send({
                                    message: errorHandler.getErrorMessage(err),
                                    status: false
                                });
                            } else {
                                res.jsonp(listDocs);
                                console.info('%d' + importType +' were successfully stored.', listDocs.length);
                            }
                        });

                    });
                    }else{
                    res.status(400).send({
                        message: 'No model with name'+importType,
                        status: false
                    });
                }

            } else {
                res.status(400).send({
                    message: 'User is not signed in'
                });
            }
        });
    } else {
        res.status(400).send({
            message: 'User is not signed in'
        });
    }
};

exports.fileExportPath = function (req,res) {
    var token = req.body.token || req.headers.token;
    var option = req.query.type;
    var fileName;
    switch(option){
        case 'contacts':fileName = config.reportLocation+'sampleformat/Contacts.xlsx';break;
        case 'products':fileName = config.reportLocation+'sampleformat/product-import-template.xlsx';break;
        case 'importcontacts':fileName = config.reportLocation+'sampleformat/contacts-import-template.xlsx';break;
        default:fileName =config.reportLocation+'sampleformat/Inventories.xlsx';break;
    }
    if (token) {
        usersJWTUtil.findUserByToken(token, function (err, user) {
            if (user) {
                if(fs.existsSync(fileName) && fs.statSync(fileName).isFile()) {
                    var type=mime.lookup(fileName);
                    fs.readFile(fileName, function (err, data) {
                        res.contentType(type);
                        res.send(data);
                    });
                }
                else{
                    res.status(400).send({message:'File does not exist on server'});
                }
            }else{
                res.status(400).send({
                    message: 'User is not signed in'
                });
            }
        });
    }
    else{
        res.status(400).send({
            message: 'User is not signed in'
        });
    }

};
