/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:43:17
* @Last modified by:   Guilherme Serradilha
* @Last modified time: 27-Apr-2016, 23:37:58
*/

// prevent dragover
document.addEventListener('dragover',function(event){
  event.preventDefault();
  return false;
},false);

// prevent dop
document.addEventListener('drop',function(event){
  event.preventDefault();
  return false;
},false);

const admzip = require('adm-zip');
const fs     = require('fs-extra');
const moment = require('moment');
const reader = require('../lib/reader');

//** INITIALIZE ANGULAR ---------------------------------------------------------------------------------------

var App = angular.module( 'ReaderApp', [ 'ngAnimate', 'ngMaterial', 'ngMdIcons' ] );

// Theme Provider
var Theme = function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('teal');
}

// Controllers
var ReaderCtrl = function($scope) {

    // load settings
    $scope.config  = require('../config.json');

    /**
     * Reads all files in given directory
     * @param  {string} dirPath
     */
    $scope.readDir = function(dirPath) {

        var dir = fs.readdirSync(dirPath),
            output = {};

        // read all files inside dir
        for (var i = 0; i < dir.length; i++) {

            // handle zip file
            if (dir[i].indexOf('.zip') !== -1) {

                var zip = new admzip(dirPath + '/' + dir[i]);
                zip.getEntries().forEach(function(entry) {
                    if (entry.entryName.indexOf('.txt') !== -1)
                        output[entry.entryName.replace($scope.config['filenamePrefix'], '').replace('.txt', '')] = reader(zip.readAsText(entry, 'utf8'), $scope.config['inputTimestamp'], $scope.config['outputTimestamp']).getData();
                    else if ($scope.config['mediaRepository'] !== '')
                        zip.extractEntryTo(entry, $scope.config['mediaRepository'], false, true);
                });

            // handle text file
            } else if (dir[i].indexOf('.txt') !== -1) {
                output[dir[i].replace($scope.config['filenamePrefix'], '').replace('.txt', '')] = reader(fs.readFileSync(dirPath + '/' + dir[i], 'utf-8'), $scope.config['inputTimestamp'], $scope.config['outputTimestamp']).getData();

            // handle media
            } else if ($scope.config['mediaRepository'] !== '') {
                fs.copySync(dirPath + '/' + dir[i], $scope.config['mediaRepository'] + '/' + dir[i]);
            }
        }

        // build csv files
        var csvEvents   = '',
            csvMessages = '',
            addHeader   = true;

        for (var f in output) {
            if (output.hasOwnProperty(f)) {
                csvEvents   += generateCSV(output[f]['events'],   f, addHeader);
                csvMessages += generateCSV(output[f]['messages'], f, addHeader);
                addHeader = false;
            }
        }

        // write csv files
        var currentWeek = moment().format('WW');
        fs.writeFileSync($scope.config['dataRepository'] + '/events_w'   + currentWeek + '.csv', csvEvents,   'utf8');
        fs.writeFileSync($scope.config['dataRepository'] + '/messages_w' + currentWeek + '.csv', csvMessages, 'utf8');
    }

    $scope.saveConfig = function() {

    }

    /**
     * Transforms object-data into an csv
     * @param  {object[]} obj         - array of JSON objects
     * @param  {string}   identifier  - identifier column (group name, user, broadcast, etc.)
     * @param  {boolean}  addHeader   - adds header data
     * @return {string}
     */
    var generateCSV = function(obj, identifier, addHeader) {

        var csv = '',
            headers = Object.keys(obj[0]);

        // write headers
        if (addHeader) {
            csv += 'identifier;';

            for (var i = 0; i < headers.length; i++)
                csv += headers[i] + ';';
            csv += '\n';
        }

        // write content
        for (var i = 0; i < obj.length; i++) {
            csv += identifier + ';';

            for (var k in obj[i]) {
                if (obj[i].hasOwnProperty(k)) {
                    csv += obj[i][k] + ';';
                }
            }
            csv += '\n';
        }
        return csv;
    }
}

// Bindings
App.config(Theme);
App.controller('ReaderCtrl', ReaderCtrl);
