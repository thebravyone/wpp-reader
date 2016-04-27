/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:43:17
* @Last modified by:   Guilherme Seradilha
* @Last modified time: 27-Apr-2016 17:20:30
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
const fs     = require('fs');
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

    $scope.config  = require('../config.json');
    $scope.dirpath = './temp/source';
    $scope.output = {};
    //$scope.reader = reader(fs.readFileSync('./temp/Conversa do WhatsApp com Onda Azul.txt', 'utf-8'),
                           //$scope.config['inputTimestamp'], $scope.config['outputTimestamp']);

    $scope.readDir = function() {

        var dir = fs.readdirSync($scope.dirpath);

        for (var i = 0; i < dir.length; i++) {
            if (dir[i].indexOf('.zip') !== -1) {
                //open zip
                //extract files
                var zip = new admzip('./temp' + '/' + dir[i]);
            } else if (dir[i].indexOf('.txt') !== -1) {
                $scope.output[dir[i].replace($scope.config['filenamePrefix'], '').replace('.txt', '')] = reader(fs.readFileSync($scope.dirpath + '/' + dir[i], 'utf-8'), $scope.config['inputTimestamp'], $scope.config['outputTimestamp']).getData();
            } else if ($scope.config['mediaRepository'] !== '') {
                //move to repo
            }
        }

        var csvEvents   = '',
            csvMessages = '',
            addHeader   = true;

        for (var f in $scope.output) {
            if ($scope.output.hasOwnProperty(f)) {
                csvEvents   += generateCSV($scope.output[f]['events'], f, addHeader);
                csvMessages += generateCSV($scope.output[f]['messages'], f, addHeader);
                addHeader = false;
            }
        }

        fs.writeFile('./temp/events_w17.csv', csvEvents, 'utf8');
        fs.writeFile('./temp/messages_w17.csv', csvMessages, 'utf8');
    }

    $scope.run = function() {
        //var files = $scope.reader.getCSV('Onda Azul', true);

        /*for (var f in files) {
            if (files.hasOwnProperty(f)) {
                fs.writeFile('./temp/teste_' + f + '.csv', files[f], 'utf8');
            }
        }*/
    };

    $scope.saveConfig = function() {

    }

    $scope.parseFile = function(buffer) {

    }

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
