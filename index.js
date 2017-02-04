const {remote, ipcRenderer} = require('electron')
const {Menu, MenuItem} = remote
const {dialog} = remote

const settings = require('electron').remote.require('./settings')

function newFile() {
  window.dispatchEvent(new CustomEvent('set-tasks',
  {
    'detail': {
      'tasks': [],
      'callback': (err => {
        if(err) {
          alert(err)
        } else {
          setFileName(null);
        }
      })
    }
  }));
}

function openFile(fileName) {
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
            setFileName(fileName);
          }
        })
      }
    }));
  }));
}

function saveFile(fileName) {
  window.dispatchEvent(new CustomEvent('get-tasks',
  {
    'detail': {
      'callback': (tasks => {
        fs.writeFile(String(fileName), JSON.stringify(tasks), function (err) {
          if(err){
            alert("An error ocurred creating the file " + err.message);
          }
          setFileName(fileName);
        });
      })
    }
  }));
}

function saveAs() {
  var fileName = dialog.showSaveDialog(fileDialogOptions);
  if(fileName) {
    saveFile(fileName);
  }
}

function setFileName(fileName) {
  window.fileName = fileName;
  refreshFileName();
}

function refreshFileName() {
  if(window.fileName) {
    settings.setFileName(settings.fileName);
    document.title = appName + " - " + window.fileName;
  }
  else {
    settings.setFileName(null);
    document.title = appName
  }
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
      if(window.fileName) {
          saveFile(window.fileName);
      } else {
          saveAs();
      }
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

var appName="";

// this listens for events from the main process
ipcRenderer.on('app-name', (event, newAppName) => {
    appName = newAppName;
    refreshFileName();
});

ipcRenderer.on('file-open', (event, fileName) => {
    openFile(fileName);
});

// TODO: delete
window.addEventListener("refreshfilename", refreshFileName, false);

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
