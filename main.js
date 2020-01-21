// electron tutorial, up to 40mins https://www.youtube.com/watch?v=kN1Czs0m1SU


const electron = require('electron');
const url = require('url');
const path = require('path');
const async = require('async');
const library = require('./library.js');
const SerialPort = require('serialport');

const {app, BrowserWindow, Menu, ipcMain} = electron;

// Set Environment - remove to enable dev-tools
//process.env.NODE_ENV = 'production';

let mainWindow;
let addWindow;

//listen for app to be ready
app.on('ready', function(){
  //create new Windows
  mainWindow = new BrowserWindow({});
  // load HTML file into Window
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'main.html'),
    protocol:'file:',
    slashes: true
  }));
  // Quit app when close main window
  mainWindow.on('closed', function(){
    app.quit();
  })

  // Build menu from Template
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  // Insert Menu
  Menu.setApplicationMenu(mainMenu);
});

// Handle add window
function createAddWindow(){
  //create new Windows
  addWindow = new BrowserWindow({
    width: 300,
    height: 200,
    title: 'Title'
  });
  // load HTML file into Window
  addWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'addWindow.html'),
    protocol:'file:',
    slashes: true
  }));
  // Garbage collection handle
  addWindow.on('close', function(){
    addWindow = null;
  });
}

//start logging
function startLogging(){
async.waterfall([
  library.initialize,
  library.logCM
], (err) => {
  if (err) {
    console.log('Something errored', err);
    return;
  }
  console.log('Done everything successfuly');
})
}

// Catch item:add
ipcMain.on('item:add', function(e, item){
  console.log(item);
  mainWindow.webContents.send('item:add', item);
  addWindow.close();
})

// Create menu template
const mainMenuTemplate = [
  {
    label:'File',
    submenu:[
      {
        label: 'Add item to list',
        click(){
          createAddWindow();
        }
      },
      {
        label: 'Clear List',
        click(){
          mainWindow.webContents.send('item:clear');
        }
      },
      {
        label: 'Start Logging',
        click(){
          startLogging();
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click(){
          app.quit();
        }
      }
    ]
  }
];

// If mac, add empty object to menu to move File visible
if(process.platform == 'darwin'){
  mainMenuTemplate.unshift({});
}

// Add dev tools item if not in production
if(process.env.NODE_ENV !== 'production'){
  mainMenuTemplate.push({
    label: 'Developer Tools',
    submenu:[
      {
        label: 'Toggle Dev Tools',
        accelerator: process.platform == 'darwin' ? 'Command+I' : 'Ctrl+I',
        click(item, focusedWindow){
          focusedWindow.toggleDevTools();
        }
      },
      {
        role: 'reload'
      }
    ]
  })
}
