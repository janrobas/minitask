const {app, BrowserWindow, webContents} = require("electron")
const path = require('path')
const url = require('url')

let win
const titleName = "minitask";

app.on("window-all-closed", function() {
  if(process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  win = new BrowserWindow({width: 1000, height: 800});

  win.webContents.openDevTools()

  win.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }))

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("app-name", titleName);
  });

  win.on("closed", () => {
    win = null;
    //app.quit;
  });
});
