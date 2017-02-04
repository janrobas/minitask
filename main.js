const {app, BrowserWindow, webContents} = require("electron")
const path = require('path')
const url = require('url')
const fs = require('fs')
const settings = require("./settings")

let win
const titleName = "minitask";
const configFile = path.join(app.getPath("userData"), "config.json");
global.settings = {};

app.on("window-all-closed", function() {
  if(process.platform != "darwin") {
    app.quit();
  }
});

app.on("ready", () => {
  win = new BrowserWindow({width: 1000, height: 800});

  //win.webContents.openDevTools()

  win.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }))

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("app-name", titleName);

    fs.readFile(configFile, function (err, data) {
      if(!err) {
        if(data)
        	global.settings = JSON.parse(String(data));

        if(settings.getFileName())
        	win.webContents.send("file-open", settings.getFileName());
      }
    });
  });

  win.on("closed", () => {
    fs.writeFile(configFile, JSON.stringify(global.settings), function (err) {
    	win = null;
    });
    //app.quit;
  });
});
