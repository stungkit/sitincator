const { app, BrowserWindow, ipcMain } = require('electron');

const google = require('googleapis');
const gcal = require('./src/gcal');
const path = require('path');

let win;

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 480, height: 800});

  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
    BrowserWindow.addDevToolsExtension(path.join(
      process.env.HOME,
      'Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/0.15.4_0')
    );
  }

  win.loadURL(`file://${__dirname}/index.html`);

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const gcalApi = new gcal.GCal(process.env.CALENDAR_ID || gcal.CALENDAR_S8);
  gcalApi.authorize()
    .then(client => {
      createWindow();

      ipcMain.on('calendar:list-events', event => client.listEvents()
        .then(items => event.sender.send('calendar:list-events-success', items))
        .catch(error => event.sender.send('calendar:list-events-error', error))
      );

      ipcMain.on('calendar:status-event', event => client.statusEvent()
        .then(item => event.sender.send('calendar:status-event-success', item))
        .catch(error => event.sender.send('calendar:status-event-error', error))
      );

      ipcMain.on('calendar:quick-reservation', (event, duration) => {
        client.insertEvent(duration)
          .then(response => event.sender.send('calendar:quick-reservation-success', response))
          .catch(error => event.sender.send('calendar:quick-reservation-error', error));
        }
      );

      client.insertEvent()
        .then(response => console.log(response))
        .catch(error => console.log(error));
    })
    .catch(() => process.exit());
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
