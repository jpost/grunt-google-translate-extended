# grunt-google-translate-extended

> A build task to translate JSON files to other languages using Google's Translation API. Pairs very well with angular-translate.

> Extended from https://github.com/dolanmiu/grunt-google-translate 

## Getting Started
This plugin requires Grunt `~0.4.5`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-google-translate --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-google-translate');
```

## The "google_translate" task

### Overview
In your project's Gruntfile, add a section named `google_translate` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  google_translate: {
    options: {
      // Task-specific options go here.
    },
    your_target: {
      // Target-specific file lists and/or options go here.
    },
  },
});
```

### Options

#### options.googleApiKey
Type: `String`
Default value: `',  '`

The API key used to access Google Translation services.

### New features in this extension

This extension of grunt-google-translate adds a couple of features:

1. Instead of having one file per language (i.e. ```en.json```), you can have many files per language (probably all under a folder for the source languague (i.e. ```/en```)). Each individual file you specify will be translated to the ```targetLanguages```, keeping the file names, and placing the translated files in a folder corresponding to each language.

2. The plugin will not translate a key/value if it sees that that term has already been translated into the target language. However, it creates a backup of each file it translates, and will check to see if any key in the source file has changed its value. If it sees a value has changed for a key, it will translate that value, even it it had been translated to the target language previously.


### Todo

1. Handle keys/values being removed from the source language file

2. Allow the user to set ```src``` to a folder of source files in the config, which would be the equivalent of specifying each individual file in that folder separately)


### Usage Examples

#### Simple Example
In this example, a specific JSON file (```dashboard.json```) with english text is specified. It will then create two two folders called ```ru``` and ```zh-CN``` in ```dest```, and place a ```dashboard.json``` in each folder, with the json file translated accordingly.

Note: This plugin will try and deduce the suffix (file type), so you don't need to explicity specify it. If you need it to have a different suffix, then specify the ```suffix``` as shown in the next example.

```js
grunt.initConfig({
    google_translate: {
        default_options: {
            options: {
                googleApiKey: YOUR_API_KEY_HERE
            },
            files: [{
                src: 'path/to/translations/en-us/dashboard.json',
                srcPrev: 'path/to/translations/previous/dashboard.json',
                sourceLanguage: 'en',
                targetLanguages: ['ru', 'zh-CN'],
                dest: 'path/to/translations'
            }]
        }
    }
});
```

#### Larger Example

In this example, two files are being translated, one called ```dashboard.json``` and another called ```page1.json```. Running the task will create ```ru``` and ```zh-CN``` folders in ```dest```, and both of those folders will contain translated ```dashboard.json``` and ```page1.json``` files at the end of execution.

```srcPrev``` will be a copy of the original ```src``` file at the time of execution. The next time the task is run, it will compare ```src``` and ```srcPrev``` in order to see if any values have changed, and thus need to be retranslated. Before the first execution, ```srcPrev``` will not exist (and so all terms from ```src``` will be translated), but ```srcPrev``` will be created during execution and used on subsequent executions.

```js
grunt.initConfig({
    google_translate: {
        default_options: {
            options: {
                googleApiKey: YOUR_API_KEY_HERE
            },
            files: [{
                src: 'path/to/translations/en-us/dashboard.json',
                srcPrev: 'path/to/translations/previous/dashboard.json',
                sourceLanguage: 'en',
                targetLanguages: ['ru', 'zh-CN'],
                dest: 'path/to/translations/',
                suffix: '.json'
            }, {
                src: 'path/to/translations/en-us/page1.json',
                srcPrev: 'path/to/translations/previous/page1.json',
                sourceLanguage: 'en',
                targetLanguages: ['ru', 'zh-CN'],
                dest: 'path/to/translations/',
                suffix: '.json'
            },]
        }
    }
});
```
