/*
 * grunt-google-translate
 * https://github.com/dolanmiu/grunt-google-translate
 *
 * Copyright (c) 2016 Dolan Miu
 * Licensed under the MIT license.
 */

/*jslint node: true, nomen: true, regexp: true*/
'use strict';

var _ = require('lodash');
var Q = require('q');

var utility = require('../utility');
var angular = require('../utility/angular');

function translate(origJson, googleTranslate, source, target, destPath, grunt) {
    var deferred = Q.defer(),
        jsonReferenceArray = [],
        sourceJson = _.cloneDeep(origJson);

    utility.deepTraverseJson(sourceJson, function (parent, value, key) {
        jsonReferenceArray.push({
            parent: parent,
            value: value,
            key: key
        });
    });

    grunt.log.writeln('Translating into: ' + target);
    googleTranslate.translate(_.map(jsonReferenceArray, 'value'), source, target, function (err, translations) {
        var i;

        if (err) {
            grunt.log.error('Failed to translate');
            return deferred.reject(err);
        }

        // Result is an object (instead of Array) in case of translating one term only
        if (jsonReferenceArray.length == 1 && translations.translatedText) {
            jsonReferenceArray[0].parent[jsonReferenceArray[0].key] = translations.translatedText;
        }
        else {
            for (i = 0; i < jsonReferenceArray.length; i += 1) {
                jsonReferenceArray[i].parent[jsonReferenceArray[i].key] = translations[i].translatedText;
            }
        }

        deferred.resolve({
            dest: destPath,
            json: sourceJson
        });
    });
    return deferred.promise;
}


module.exports = function (grunt) {
    var promises = [];

    grunt.registerMultiTask('google_translate', 'A build task to translate JSON files to other languages using Google\'s Translation API. Pairs very well with angular-translate.', function () {
        var done = this.async(),
            defer = Q.defer(),
            googleTranslate = require('google-translate')(this.options().googleApiKey);


        this.files.forEach(function (file) {
            //Extract the file name (without extension) from from file source.
            //This will be everything after the last slash, and before the file's extension
            var fileName = /([^\/]+)(?=\.\w+$)/.exec(file.src)[0];
            file.prefix = file.prefix || '';
            file.suffix = file.suffix || /.+(\..+)/.exec(file.src)[1];

            //Read in the json from the latest source file
            var currentLanguageSourceJson = JSON.parse(grunt.file.read(file.src));
            var currentVariableSafeJson = angular.createVariableSafeJson(currentLanguageSourceJson);
            
            //Read in the json from the last execution of the translate command (if found).
            //This will be used to see if any values have changed, in which case we will re-translate them
            var previousPath = file.srcPrev;
            var previousVariableSafeJson = null;
            if (grunt.file.exists(previousPath)) {
                var previousLanguageSourceJson = JSON.parse(grunt.file.read(previousPath));
                previousVariableSafeJson = angular.createVariableSafeJson(previousLanguageSourceJson);
            }

            //Write backup for this source language file, so the next time we run we can compare 
            //to see if any source language values have changed and need to be re-translated
            grunt.log.writeln('Writing backup for ' + fileName);
            grunt.file.write(file.srcPrev, JSON.stringify(currentLanguageSourceJson, null, "\t"));

            file.targetLanguages.forEach(function (targetLanguage) {
                //Construct the export path for this language
                var destinationPath = file.dest + targetLanguage + "/" + file.prefix + fileName + file.suffix;
                              
                //Read in the current JSON object for the target language, that is the keys and values that have already been translated for this language
                //If the translated file does not yet exist, default to an empty object for the already-translated json
                var thisLanguageAlreadyTranslatedJson = {};
                if (grunt.file.exists(destinationPath)) {
                    var thisLanguageAlreadyTranslatedJson = JSON.parse(grunt.file.read(destinationPath));
                }

                //Determine which keys from the source language need to be translated
                //These will those keys in the source file that
                //1. do not already exist in the target language's json (probably the first translation of this file, or a key/value added since the last run)
                //2. have had their value in the source language changed since the previous run, meaning we need to update the translation to this language as well
                var needTranslation = {};
                for (var key in currentVariableSafeJson) {
                    if (typeof thisLanguageAlreadyTranslatedJson[key] == 'undefined') {
                        console.log("did not find key already translated; adding to list");
                        needTranslation[key] = currentVariableSafeJson[key];                      
                    } else if (previousVariableSafeJson != null && typeof previousVariableSafeJson[key] != 'undefined' && currentLanguageSourceJson[key] !== previousVariableSafeJson[key]) {
                        console.log("value for key in source language has changed, adding to list to re-translate");
                        needTranslation[key] = currentVariableSafeJson[key];
                    }
                }
                
                if (Object.keys(needTranslation).length > 0) {
                    //Have google translate only those keys from the source language that we have not yet translated to the target language
                    promises.push(translate(needTranslation, googleTranslate, file.sourceLanguage, targetLanguage, destinationPath, grunt));
                }
            });
        });

        Q.all(promises).then(function (translatedJsons) {
            translatedJsons.forEach(function (translatedJson) {
                var revertedJson = angular.revertVariablesInJson(translatedJson.json);

                //If the translation file already exists for this language, read in the JSON 
                //so we can append the new translations to the existing translations
                var existingJson = {};
                if (grunt.file.exists(translatedJson.dest)) {
                    existingJson = JSON.parse(grunt.file.read(translatedJson.dest));
                }
                
                //Add the newly translated values to the already existing json for this language
                for (var key in revertedJson) {
                    existingJson[key] = revertedJson[key];
                }
                grunt.log.writeln('Writing ' + Object.keys(revertedJson).length + ' new translations to ' + translatedJson.dest);
                grunt.file.write(translatedJson.dest, JSON.stringify(existingJson, null, "\t"));
            });
            done();
        }, function (err) {
            grunt.fail.fatal(err);
        });

    });

};