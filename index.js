const {remote, ipcRenderer} = require('electron')
const {Menu, MenuItem} = remote
const {dialog} = remote

const settings = require('electron').remote.require('./settings')

window.changeHappened = false;

let newFile = () => {
  window.dispatchEvent(new CustomEvent('set-tasks',
  {
    'detail': {
      'tasks': [],
      'callback': (err => {
        if(err) {
          alert(err)
        } else {
          window.changeHappened = false;
          setFileName(null);
        }
      })
    }
  }));
}

let openFile = (fileName) => {
  fs.readFile(String(fileName), (function (err, data) {
    if (err) throw err;
    window.dispatchEvent(new CustomEvent('set-tasks',
    {
      'detail': {
        'tasks': JSON.parse(data),
        'callback': (err => {
          if(err) {
            alert(err)
          }
          else {
            window.changeHappened = false;
            setFileName(fileName);
          }
        })
      }
    }));
  }));
}

let saveFile = (fileName) => {
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
        });
      })
    }
  }));
}

let saveAs = () => {
  var fileName = dialog.showSaveDialog(fileDialogOptions);
  if(fileName) {
    saveFile(fileName);
  }
}

let save = () => {
  if(window.fileName) {
    saveFile(window.fileName);
  } else {
    saveAs();
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

const fileDialogOptions = {
  filters: [
    {name: 'JSON File Type', extensions: ['json']},
    {name: 'All Files', extensions: ['*']}
  ]
};
const template = [
{
  label: "File",
  submenu: [
    {
    label: "New",
    click: (() => {
      newFile();
    })
    },

    {
    label: "Open",
    click: (() => {
      var fileName = dialog.showOpenDialog(fileDialogOptions);
      if(fileName) {      
        openFile(fileName);
      }
    })
    },

    {
    label: "Save",
    click: (() => {
      save();
    })
    },

    {
    label: "Save as...",
    click: (() => {
      saveAs();
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
}
];

window.addEventListener('beforeunload', function (event) {
  if(window.changeHappened) {
    var answer = confirm('Changes have been made. Do you want to save them?');
    if(answer)
      save();
  }

  return;
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

window.addEventListener("change-happened", changeHandler, false);

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
