const {remote, ipcRenderer} = require('electron')
const {Menu, MenuItem} = remote
const {dialog} = remote
const fs = require('fs-promise');

const settings = require('electron').remote.require('./settings');

window.changeHappened = false;

const fileDialogOptions = {
  filters: [
    {name: 'JSON File Type', extensions: ['json']},
    {name: 'All Files', extensions: ['*']}
  ]
};

let newFile = () => {
  askToSaveIfChanged();

  // new file means no tasks; we set tasks to empty array
  window.dispatchEvent(new CustomEvent('set-tasks',
  {
    'detail': {
      'tasks': [],
      'callback': (err => {
        if(err) {
          alert(err)
        } else {
          // new file means no changes
          window.changeHappened = false;
          setFileName(null);
        }
      })
    }
  }));
}

let openFile = (fileName) => {
  askToSaveIfChanged();

  fs.readFile(String(fileName), (function (err, data) {
    if (err) throw err;
    window.dispatchEvent(new CustomEvent('set-tasks',
    {
      'detail': {
        'tasks': JSON.parse(data),
        'callback': (err => {
          if(err) {
            alert(err);
          } else {
            window.changeHappened = false;
            setFileName(fileName);
          }
        })
      }
    }));
  }));
}

let saveFile = (fileName, callback) => {
  window.dispatchEvent(new CustomEvent('get-tasks',
  {
    'detail': {
      'callback': (tasks => {
        fs.writeFile(String(fileName), JSON.stringify(tasks), function (err) {
          if(err){
            alert("An error ocurred creating the file " + err.message);
          }
          window.changeHappened = false;
          setFileName(fileName);

          if(callback)
            callback();
        });
      })
    }
  }));
}

let saveAs = (callback) => {
  var fileName = dialog.showSaveDialog(fileDialogOptions);
  if(fileName) {
    saveFile(fileName, callback);
  }
}

let save = (callback) => {
  if(window.fileName) {
    saveFile(window.fileName, callback);
  } else {
    saveAs(callback);
  }
}

let setFileName = (fileName) => {
  window.fileName = fileName;
  refreshFileName();
}

let refreshFileName = () => {
  if(window.fileName) {
    settings.setFileName(window.fileName);
  }
  else {
    settings.setFileName(null);
  }
  refreshTitleBar();
}

let refreshTitleBar = () => {
  if(window.fileName) {
    document.title = appName + " - " + window.fileName;
  }
  else {
    document.title = appName
  }

  if(window.changeHappened) {
    document.title += "*";
  }
}

let changeHandler = () => {
  window.changeHappened = true;
  refreshTitleBar();
}

let askToSaveIfChanged = (callback) => {
  if(window.changeHappened)
    askToSave(callback)
}

let askToSave = (callback) => {
  var answer = confirm('Changes have been made. Do you want to save them?');
  if(answer) {
    save(callback);
    return true;
  } else {
    window.changeHappened = false;
    return false;
  }
}

let setThemeInternal = th => {
  var oldlink = document.querySelector("[data-theme]");
  oldlink.setAttribute("href", "themes/" + th);
  settings.setTheme(th);
}

let setTheme = th => {
  if(th) {
    setThemeInternal(th);
  } else {
    setThemeInternal(settings.getTheme());
  }
}

window.addEventListener('beforeunload', function (e) {
  if(window.changeHappened) {
    var saving = askToSave(x=>window.close());

    if(saving) {
      e.returnValue = "false";
    }
  }
});

var appName="";

// this listens for events from the main process
ipcRenderer.on('app-name', (event, newAppName) => {
    appName = newAppName;
    refreshFileName();
});

ipcRenderer.on('file-open', (event, fileName) => {
    openFile(fileName);
});

ipcRenderer.on('set-theme', (event, theme) => {
    setTheme(theme);
});

window.addEventListener("change-happened", changeHandler, false);

let themes=[];
let themesMenu=[];

fs.readdir("themes/")
.then(function(dir) {
  themes=dir.sort((a,b) => a == "default.css" ? -1 : a < b);

  function withoutExtension(fileName) {
    var friendlyName = fileName.substr(0, fileName.lastIndexOf('.')) || fileName;

    if(friendlyName == "default")
      friendlyName = "Spring (default)";

    return friendlyName;
  }

  var currentTheme = settings.getTheme();

  themesMenu=dir.map(x=>({ label: withoutExtension(x), click:e=>setTheme(x), type: 'radio', checked: x == currentTheme }));

  const template = [
  {
    label: "File",
    submenu: [
      {
      label: "New",
      accelerator: "CmdOrCtrl+N",
      click: (() => {
        newFile("default");
      })
      },

      {
      label: "Open",
      accelerator: "CmdOrCtrl+O",
      click: (() => {
        var fileName = dialog.showOpenDialog(fileDialogOptions);
        if(fileName) {
          openFile(fileName);
        }
      })
      },

      {
      label: "Save",
      accelerator: "CmdOrCtrl+S",
      click: (() => {
        save();
      })
      },

      {
      label: "Save as...",
      accelerator: "Shift+CmdOrCtrl+S",
      click: (() => {
        saveAs();
      })
      },

      {
      label: "Quit",
      accelerator: "Ctrl+Q",
      click: (() => {
        window.close();
      })
      }
    ]
  },
  {
    label: "Task",
    submenu: [
      {
      label: "New task",
      click: (() => {
        window.dispatchEvent(new CustomEvent('newtask'));
      })
      //click () { require('electron').shell.openExternal('http://electron.atom.io') }
      }
    ]
  },
  {
    label: "Preferences",
    submenu: [
      {
        label: "Themes",
        submenu: themesMenu
      }
    ]
  }
  ];

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
});
