/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:43:17
* @Last modified by:   Guilherme Seradilha
* @Last modified time: 22-Nov-2016 11:59:20
*/

// prevent dragover
document.addEventListener('dragover',function(event){
  event.preventDefault();
  return false;
},false);

// prevent drop
document.addEventListener('drop',function(event){
  event.preventDefault();
  return false;
},false);

const admzip = require('adm-zip');
const fs     = require('fs-extra');
const moment = require('moment');
const path   = require("path");
const reader = require('../lib/reader');
const remote = require('remote');
const shell  = require('electron').shell;

const {dialog} = remote;

//** INITIALIZE ANGULAR ---------------------------------------------------------------------------------------

var App = angular.module( 'ReaderApp', [ 'ngAnimate', 'ngMaterial', 'ngMdIcons' ] );

// Theme Provider
var Theme = function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('teal');
}

// Controllers
var ReaderCtrl = function($scope) {

    /**
     * Changes current application state
     * @param  {string} state
     */
    $scope.changeState = function(state) {
        $scope.appState = state;
    }

    /**
     * Terminates current application
     */
    $scope.exit = function() {
        remote.getCurrentWindow().close();
    }

    /**
     *  Opens data-output folder
     */
    $scope.openOutputFolder = function() {
        shell.showItemInFolder($scope.outputPath);
    }

    /**
     * Saves config data to file
     */
    $scope.saveConfig = function() {
        fs.writeFile('config.json', JSON.stringify($scope.config, null, 4), function(error) {
          if (error) throw error;
        });
        $scope.changeState('home');
    }


    $scope.dataFolderDialog = function() {
        dialog.showOpenDialog({defaultPath: $scope.config['dataRepository'], properties: [ 'openDirectory' ]}, function(filenames) {
            if (filenames) {
                $scope.config['dataRepository'] = filenames[0];
            }
        });
    }

    $scope.mediaFolderDialog = function() {

        var defaultPath = '';
        if ($scope.hasMediaPath) defaultPath = $scope.config['mediaRepository'];
        else defaultPath = $scope.config['dataRepository'];

        dialog.showOpenDialog({defaultPath: defaultPath, properties: [ 'openDirectory' ]}, function(filenames) {
            if (filenames) {
                $scope.config['mediaRepository'] = filenames[0];
            }
        });
    }

    $scope.sourceFolderDialog = function() {
        dialog.showOpenDialog({properties: [ 'openDirectory' ]}, function(filenames) {
            if (filenames) {
                $scope.dirPath = filenames[0];
                $scope.parseDir();
            }
        });
    }

    /**
     * Reads all files in given directory and then exports it
     */
    $scope.parseDir = function() {
        fs.readdir($scope.dirPath, function(err, dir) {
            var output = {};

            // read all files inside dir
            for (var i = 0; i < dir.length; i++) {

                // handle zip file
                if (dir[i].indexOf('.zip') !== -1) {

                    var zip = new admzip($scope.dirPath+ '/' + dir[i]);
                    zip.getEntries().forEach(function(entry) {
                        if (entry.entryName.indexOf('.txt') !== -1)
                            output[entry.entryName.replace($scope.config['filenamePrefix'], '').replace('.txt', '')] = reader(zip.readAsText(entry, 'utf8'), $scope.config['inputTimestamp'], $scope.config['outputTimestamp']).getData();
                        else if ($scope.hasMediaPath)
                            zip.extractEntryTo(entry, $scope.config['mediaRepository'], false, true);
                    });

                // handle text file
                } else if (dir[i].indexOf('.txt') !== -1) {
                    output[dir[i].replace($scope.config['filenamePrefix'], '').replace('.txt', '')] = reader(fs.readFileSync($scope.dirPath + '/' + dir[i], 'utf-8'), $scope.config['inputTimestamp'], $scope.config['outputTimestamp']).getData();

                // handle media
                } else if ($scope.hasMediaPath) {
                    fs.copySync($scope.dirPath + '/' + dir[i], $scope.config['mediaRepository'] + '/' + dir[i]);
                }
            }

            $scope.parsedData = output;
            $scope.chatNames  = Object.keys(output);
            $scope.chats      = [];

            // ask for counter data
            for (var i = 0; i < $scope.chatNames.length; i++) {
                var name  = $scope.chatNames[i],
                    count = 0;

                // check if it's in config
                if ($scope.config.hasOwnProperty('chats')) {
                    for (var j = 0; j < $scope.config.chats.length; j++) {
                        if ($scope.config.chats[j].name === name)
                            count = $scope.config.chats[j].count;
                    }
                }
                $scope.chats.push({name: name, count: count});
            }

            $scope.appState = 'ready';
            if (!$scope.$$phase) $scope.$apply();
        });
    }

    $scope.exportData = function() {

        var today = moment().format('YYYY-MM-DD'),
            data  = $scope.parsedData;

        if ($scope.format === 'json') {

            //write json file
            fs.writeFileSync($scope.config['dataRepository'] + '/whatsapp_' + today + '.json', JSON.stringify(data, null, 4),   'utf8');

        } else if ($scope.format === 'csv') {

            // build csv files
            var csvEvents   = '',
                csvMessages = '',
                csvCounter  = '',
                addHeader   = true;

            for (var f in data) {
                if (data.hasOwnProperty(f)) {
                    csvEvents   += generateCSV(data[f]['events'],   f, addHeader);
                    csvMessages += generateCSV(data[f]['messages'], f, addHeader);
                    addHeader = false;
                }
            }

            csvCounter = 'identifier;count;\n';
            for (var i = 0; i < $scope.chats.length; i++) {
                csvCounter += $scope.chats[i].name + ';' + $scope.chats[i].count + ';\n';
            }

            // write csv files
            try {

                fs.writeFileSync($scope.config['dataRepository'] + '/events_'   + today + '.csv', csvEvents,   'utf8');
                fs.writeFileSync($scope.config['dataRepository'] + '/messages_' + today + '.csv', csvMessages, 'utf8');
                fs.writeFileSync($scope.config['dataRepository'] + '/count_'    + today + '.csv', csvCounter,  'utf8');

            } catch (err) {
                var message = 'Não foi possível salvar os arquivos.';

                     if (err.code == 'ENOSPC') { message += ' Motivo: Sem espaço em disco.' }
                else if (err.code == 'EACCES') { message += ' Motivo: Acesso negado.' }
                else if (err.code == 'EACCES') { message += ' Motivo: Caminho não existe.' }

                console.error(message, err);
                return;
            }

            $scope.outputPath = $scope.config['dataRepository'] + '/messages_'   + today + '.csv';
        }

        // save counter config
        $scope.config.chats = $scope.chats;
        $scope.saveConfig();

        $scope.appState = 'success';
        if (!$scope.$$phase) $scope.$apply();
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

    /**
     * Checks and fixes config data
     */
    var checkConfig = function() {
        fs.access($scope.config['dataRepository'], fs.R_OK | fs.W_OK, function(err) {
            if (err) $scope.config['dataRepository'] = path.join(__dirname, '../output');
            $scope.hasDataPath = true;
        });

        fs.access($scope.config['mediaRepository'], fs.R_OK | fs.W_OK, function(err) {
            if (err) $scope.config['mediaRepository'] = '';
            else $scope.hasMediaPath = true;
        });
    }

    $scope.appState = 'home';
    $scope.hasDataPath = false;
    $scope.hasMediaPath = false;

    $scope.format = 'csv';
    $scope.parsedData = {};

    // load settings
    $scope.config  = require('../config.json');
    checkConfig();
}

// Bindings
App.config(Theme);
App.controller('ReaderCtrl', ReaderCtrl);
