/**
* @Author: Guilherme Serradilha
* @Date:   26-Apr-2016, 21:43:05
* @Last modified by:   Guilherme Serradilha
* @Last modified time: 03-Jul-2016, 15:47:40
*/


const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  app.quit();
});

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        width: 410,
        height: 500,
        resizable: false,
        frame: false,
        autoHideMenuBar: true,
        maximizable: false,
        fullscreenable: false,
        backgroundColor: '#FFFFFF',
    });
    mainWindow.loadURL('file://' + __dirname + '/renderer/index.html');
    //mainWindow.webContents.openDevTools();
    mainWindow.focus();
});
