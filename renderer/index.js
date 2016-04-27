/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:43:17
* @Last modified by:   Guilherme Serradilha
* @Last modified time: 26-Apr-2016, 22:50:50
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

//** INITIALIZE ANGULAR ---------------------------------------------------------------------------------------

var App = angular.module( 'ReaderApp', [ 'ngAnimate', 'ngMaterial', 'ngMdIcons' ] );

// Theme Provider
var Theme = function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('teal');
}

// Controllers
var ReaderCtrl = function($scope) {

    $scope.config = require('../config.json');

    $scope.run = function() {
        //var entries = openFile('./data/Conversa do WhatsApp com Regional Leste.txt').split('\n');

        //var text = JSON.stringify(sort(mapTimestamps(fixEntries(entries))), null, 4);

        //fs.writeFile('./data/Leste.txt', text , 'utf8');
    };

    $scope.saveConfig = function() {

    }
}

// Bindings
App.config(Theme);
App.controller('ReaderCtrl', ReaderCtrl);
