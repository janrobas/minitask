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
  win = new BrowserWindow({width: 1300, height: 800});

  win.webContents.openDevTools()

  win.loadURL(url.format({
    pathname: path.join(__dirname, "index.html"),
    protocol: "file:",
    slashes: true
  }))

  win.webContents.on("did-finish-load", () => {
    win.webContents.send("app-name", titleName);

    // read settings from file
    fs.readFile(configFile, function (err, data) {
      if(!err) {
        if(data) {          
        	// save settings to global variable
          console.log("'" + data.toString() + "'");
        	global.settings = JSON.parse(data.toString());
        }

        // load last used file
        if(settings.getFileName())
        	win.webContents.send("file-open", settings.getFileName());

        // set theme
        win.webContents.send("set-theme", settings.getTheme());
      }
    });
  });

  win.on("closed", () => {
  	// write settings
    //console.log(JSON.stringify(global.settings));

    try {
      fs.writeFileSync(configFile, JSON.stringify(global.settings));
    } catch(err) {
      console.error("Error saving settings: " + err);
    } finally {
      //console.log("OK");
      //app.quit;
    }
  });
});